// La surveillance des visites dans le logiciel de gestion (décidé le 9 octobre 2026) : des seuils prudents signalent les
// comptes louches (trop de visites validées dans une journée, trop de refus venant d'au moins 2 lieux), les lieux qui
// refusent beaucoup, et les contestations de refus à relire. Rien n'est bloqué tout seul : l'équipe regarde et décide.
// Les seuils se règlent dans le logiciel. « Vu » et « relue » sont gardés dans les réglages de gestion, sans toucher aux
// visites : un compte vu revient s'il dépasse un nouveau jour ou s'il a plus de refus qu'au moment où on l'a vu.
// Jamais la position, le code ni le règlement des visites.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import { repererComptesLouches, type RaisonCompte, type VisiteDecidee } from "../../fonctions/surveillance/reperer-comptes-louches.ts";
import { repererLieuxRefusants } from "../../fonctions/surveillance/reperer-lieux-refusants.ts";
import { BORNES_SEUILS, SEUILS_PAR_DEFAUT, type SeuilsSurveillance } from "./seuils-surveillance.ts";

const CLE_SEUILS = "seuils-surveillance";
const CLE_VUS = "surveillance-vus";
const UN_JOUR = 86_400_000;
const CACHE_COMPTEURS = 5 * 60_000;
/** Les contestations relues restent affichées 90 jours après la décision du lieu */
const RELUES_AFFICHEES = 90 * UN_JOUR;
const CONTESTATIONS_MAX = 200;

/** Ce que l'équipe a déjà vu : par compte, les jours et le nombre de refus ; par lieu, le nombre de refus */
type Vus = { comptes: Record<string, { jours: string[]; refus: number }>; lieux: Record<string, number>; contestations: number[] };

async function lireReglage<T>(cle: string): Promise<T | null> {
  return ((await baseDeDonnees.reglageGestion.findUnique({ where: { cle } }))?.valeur as T | undefined) ?? null;
}

async function ecrireReglage(cle: string, contenu: unknown) {
  const valeur = contenu as Prisma.InputJsonValue;
  await baseDeDonnees.reglageGestion.upsert({ where: { cle }, create: { cle, valeur }, update: { valeur } });
}

async function lireVus(): Promise<Vus> {
  const vus = await lireReglage<Partial<Vus>>(CLE_VUS);
  return { comptes: vus?.comptes ?? {}, lieux: vus?.lieux ?? {}, contestations: vus?.contestations ?? [] };
}

let compteurs: { calculeLe: number; valeur: { comptes: number; lieux: number; contestations: number } } | null = null;
const oublierCompteurs = () => { compteurs = null; };

/** Les seuils enregistrés, complétés par les valeurs par défaut (une valeur hors bornes est ignorée) */
export async function lireSeuilsSurveillance(): Promise<SeuilsSurveillance> {
  const enregistres = (await lireReglage<Record<string, unknown>>(CLE_SEUILS)) ?? {};
  const seuils = { ...SEUILS_PAR_DEFAUT };
  for (const cle of Object.keys(SEUILS_PAR_DEFAUT) as (keyof SeuilsSurveillance)[]) {
    const valeur = enregistres[cle];
    const [min, max] = BORNES_SEUILS[cle];
    if (typeof valeur === "number" && Number.isInteger(valeur) && valeur >= min && valeur <= max) seuils[cle] = valeur;
  }
  return seuils;
}

export async function ecrireSeuilsSurveillance(seuils: SeuilsSurveillance) {
  await ecrireReglage(CLE_SEUILS, seuils);
  oublierCompteurs();
}

/** Les visites décidées par les lieux dans la fenêtre, et ce qui en ressort */
async function reperer(maintenant: Date) {
  const seuils = await lireSeuilsSurveillance();
  const depuis = new Date(maintenant.getTime() - seuils.fenetreJours * UN_JOUR);
  const lignes = await baseDeDonnees.visite.findMany({
    where: { statut: { in: ["validee", "refusee", "retiree"] }, OR: [{ valideLe: { gte: depuis } }, { decideLe: { gte: depuis } }] },
    select: { compteId: true, lieuId: true, statut: true, valideLe: true, motifRefus: true },
  });
  const visites = lignes as (VisiteDecidee & { motifRefus: string | null })[];
  const comptes = repererComptesLouches(visites, seuils);
  const lieux = repererLieuxRefusants(visites, { partRefusMin: seuils.lieuxPartRefusMin, decisionsMin: seuils.lieuxDecisionsMin });
  return { seuils, depuis, visites, comptes, lieux };
}

const compteNouveau = (raisons: RaisonCompte[], vu: Vus["comptes"][string] | undefined) =>
  !vu || raisons.some((raison) => (raison.type === "par-jour" ? !vu.jours.includes(raison.jour) : raison.refusees > vu.refus));

/** Les contestations de refus, les non relues d'abord (les relues des 90 derniers jours ensuite) */
async function listerContestations(maintenant: Date, relues: number[]) {
  const lignes = await baseDeDonnees.visite.findMany({
    where: { contestee: true, statut: { in: ["refusee", "retiree"] }, OR: [{ id: { notIn: relues } }, { decideLe: { gte: new Date(maintenant.getTime() - RELUES_AFFICHEES) } }] },
    orderBy: { decideLe: "desc" },
    take: CONTESTATIONS_MAX,
    select: {
      id: true, mode: true, statut: true, motifRefus: true, contestation: true, creeLe: true, decideLe: true,
      compte: { select: { id: true, prenom: true, pseudo: true, email: true } },
      lieu: { select: { id: true, nom: true, ville: true } },
    },
  });
  const contestations = lignes.map((ligne) => ({ ...ligne, relue: relues.includes(ligne.id) }));
  return [...contestations.filter((c) => !c.relue), ...contestations.filter((c) => c.relue)];
}

/** GET /surveillance : les seuils, les comptes signalés (avec leurs raisons), les lieux qui refusent et les contestations */
export async function lireSurveillance(maintenant = new Date()) {
  const [{ seuils, depuis, visites, comptes, lieux }, vus] = await Promise.all([reperer(maintenant), lireVus()]);
  const idsLieux = new Set([...lieux.map((l) => l.lieuId), ...visites.filter((v) => comptes.has(v.compteId) && v.statut !== "validee").map((v) => v.lieuId)]);
  const [fichesComptes, fichesLieux, contestations] = await Promise.all([
    baseDeDonnees.compte.findMany({ where: { id: { in: [...comptes.keys()] } }, select: { id: true, prenom: true, pseudo: true, ville: true, email: true, creeLe: true } }),
    baseDeDonnees.lieu.findMany({ where: { id: { in: [...idsLieux] } }, select: { id: true, nom: true, ville: true } }),
    listerContestations(maintenant, vus.contestations),
  ]);
  const lieuDe = new Map(fichesLieux.map((lieu) => [lieu.id, lieu]));
  const compteDe = new Map(fichesComptes.map((compte) => [compte.id, compte]));
  const signales = [...comptes.entries()].flatMap(([id, raisons]) => {
    const compte = compteDe.get(id);
    if (!compte) return [];
    const refusParLieu = new Map<number, number>();
    for (const v of visites) if (v.compteId === id && v.statut !== "validee") refusParLieu.set(v.lieuId, (refusParLieu.get(v.lieuId) ?? 0) + 1);
    return [{
      compte, raisons, nouveau: compteNouveau(raisons, vus.comptes[id]),
      refusPar: [...refusParLieu.entries()].map(([lieuId, refus]) => ({ lieu: lieuDe.get(lieuId) ?? { id: lieuId, nom: "Lieu supprimé", ville: "" }, refus })).sort((a, b) => b.refus - a.refus),
      contestations: contestations.filter((c) => c.compte.id === id).length,
    }];
  });
  const lieuxSignales = lieux.flatMap((l) => {
    const lieu = lieuDe.get(l.lieuId);
    if (!lieu) return [];
    const motifs: Record<string, number> = {};
    for (const v of visites) if (v.lieuId === l.lieuId && v.statut !== "validee") motifs[v.motifRefus ?? "retiree"] = (motifs[v.motifRefus ?? "retiree"] ?? 0) + 1;
    return [{ lieu, refusees: l.refusees, decidees: l.decidees, part: l.part, motifs, nouveau: vus.lieux[l.lieuId] === undefined || l.refusees > vus.lieux[l.lieuId] }];
  });
  return {
    seuils, parDefaut: SEUILS_PAR_DEFAUT, depuis,
    comptes: signales.sort((a, b) => Number(b.nouveau) - Number(a.nouveau) || b.raisons.length - a.raisons.length),
    lieux: lieuxSignales.sort((a, b) => Number(b.nouveau) - Number(a.nouveau)),
    contestations,
  };
}

/** Pour les pastilles du menu (relu au plus toutes les 5 minutes) : ce qui n'a pas encore été vu */
export async function compterSurveillance(maintenant = new Date()) {
  if (compteurs && maintenant.getTime() - compteurs.calculeLe < CACHE_COMPTEURS) return compteurs.valeur;
  const [{ comptes, lieux }, vus] = await Promise.all([reperer(maintenant), lireVus()]);
  const contestations = await baseDeDonnees.visite.count({ where: { contestee: true, statut: { in: ["refusee", "retiree"] }, id: { notIn: vus.contestations } } });
  const valeur = {
    comptes: [...comptes.entries()].filter(([id, raisons]) => compteNouveau(raisons, vus.comptes[id])).length,
    lieux: lieux.filter((l) => vus.lieux[l.lieuId] === undefined || l.refusees > vus.lieux[l.lieuId]).length,
    contestations,
  };
  compteurs = { calculeLe: maintenant.getTime(), valeur };
  return valeur;
}

/**
 * « Vu, rien à signaler » sur un compte ou un lieu signalé : il passe en bas de la liste et ne compte plus dans les
 * pastilles, jusqu'à du nouveau. Les « vus » des comptes et lieux qui ne sont plus signalés sont oubliés au passage.
 * Rend false s'il n'est pas signalé.
 */
export async function marquerSurveilleVu(type: "compte" | "lieu", id: number, maintenant = new Date()) {
  const [{ comptes, lieux }, vus] = await Promise.all([reperer(maintenant), lireVus()]);
  const lieu = lieux.find((l) => l.lieuId === id);
  if (type === "compte" ? !comptes.has(id) : !lieu) return false;
  const garderSignales = <T>(enregistres: Record<string, T>, signales: Set<number>) =>
    Object.fromEntries(Object.entries(enregistres).filter(([cle]) => signales.has(Number(cle))));
  const suivant: Vus = {
    comptes: garderSignales(vus.comptes, new Set(comptes.keys())),
    lieux: garderSignales(vus.lieux, new Set(lieux.map((l) => l.lieuId))),
    contestations: vus.contestations,
  };
  if (type === "compte") {
    const raisons = comptes.get(id) ?? [];
    suivant.comptes[id] = {
      jours: raisons.flatMap((raison) => (raison.type === "par-jour" ? [raison.jour] : [])),
      refus: raisons.reduce((plus, raison) => (raison.type === "refus" ? Math.max(plus, raison.refusees) : plus), 0),
    };
  } else if (lieu) suivant.lieux[id] = lieu.refusees;
  await ecrireReglage(CLE_VUS, suivant);
  oublierCompteurs();
  return true;
}

/** « Relue » sur une contestation de refus ; null si la visite n'est pas contestée. Rend le compte et le lieu concernés. */
export async function marquerContestationRelue(id: number) {
  const visite = await baseDeDonnees.visite.findFirst({ where: { id, contestee: true }, select: { id: true, compteId: true, lieuId: true } });
  if (!visite) return null;
  const vus = await lireVus();
  if (!vus.contestations.includes(id)) {
    // On ne garde que les visites contestées qui existent encore (les autres ont été effacées avec leur compte)
    const existantes = await baseDeDonnees.visite.findMany({ where: { id: { in: vus.contestations }, contestee: true }, select: { id: true } });
    await ecrireReglage(CLE_VUS, { ...vus, contestations: [...existantes.map((v) => v.id), id] });
    oublierCompteurs();
  }
  return { compteId: visite.compteId, lieuId: visite.lieuId };
}
