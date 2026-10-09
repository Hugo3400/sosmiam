// Miam Safe dans le logiciel de gestion : les signalements à lire sous 48 heures (promis aux Miamis), les alertes silencieuses
// restées sans « On arrive », les lieux qui ont signé la charte, et ce que l'équipe décide (contacter le lieu, lui retirer
// sa charte, le masquer). Rien de tout ça n'apparaît sur la fiche publique d'un lieu.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { ActionMiamSafe } from "./actions-miam-safe.ts";
import { DUREE_GARDE_ALERTES_MS } from "../miam-safe-regles.ts";
import { DELAI_LECTURE_SIGNALEMENT_HEURES, DELAI_RELANCE_ALERTE_SECONDES } from "../../../../../packages/commun/src/regles/miam-safe.ts";


export type VueMiamSafe = "a-traiter" | "traite" | "alertes" | "chartes";

const iso = (date: Date | null) => date?.toISOString() ?? null;
const LIEU = { select: { id: true, nom: true, ville: true, emoji: true } } as const;

/** Un signalement est en retard au-delà de 48 heures sans décision */
function limiteRetard(maintenant: Date) {
  return new Date(maintenant.getTime() - DELAI_LECTURE_SIGNALEMENT_HEURES * 3600_000);
}
/** Une alerte est « sans réponse » 2 minutes après son envoi */
function limiteSansReponse(maintenant: Date) {
  return new Date(maintenant.getTime() - DELAI_RELANCE_ALERTE_SECONDES * 1000);
}

/** Les compteurs des onglets et de la pastille du menu */
export async function compterMiamSafe(maintenant = new Date()) {
  const [aTraiter, enRetard, sansReponse, chartes] = await Promise.all([
    baseDeDonnees.signalementMiamSafe.count({ where: { statut: "a-traiter" } }),
    baseDeDonnees.signalementMiamSafe.count({ where: { statut: "a-traiter", creeLe: { lt: limiteRetard(maintenant) } } }),
    baseDeDonnees.alerteMiamSafe.count({ where: { repondueLe: null, vueLe: null, creeLe: { lt: limiteSansReponse(maintenant) } } }),
    baseDeDonnees.charteMiamSafe.count({ where: { retireeLe: null } }),
  ]);
  return { aTraiter, enRetard, sansReponse, chartes };
}

export async function listerMiamSafe(vue: string, maintenant = new Date()) {
  const compteurs = await compterMiamSafe(maintenant);
  if (vue === "alertes") {
    const alertes = await baseDeDonnees.alerteMiamSafe.findMany({
      where: { repondueLe: null, vueLe: null, creeLe: { lt: limiteSansReponse(maintenant) } },
      orderBy: { creeLe: "desc" },
      take: 200,
      select: { id: true, prenom: true, endroit: true, detail: true, creeLe: true, lieu: LIEU },
    });
    return { vue, compteurs, alertes: alertes.map((a) => ({ ...a, creeLe: a.creeLe.toISOString() })) };
  }
  if (vue === "chartes") {
    const chartes = await baseDeDonnees.charteMiamSafe.findMany({
      orderBy: { signeeLe: "desc" },
      take: 500,
      select: { signeeLe: true, retireeLe: true, motifRetrait: true, lieu: LIEU },
    });
    return { vue, compteurs, chartes: chartes.map((c) => ({ ...c, signeeLe: c.signeeLe.toISOString(), retireeLe: iso(c.retireeLe) })) };
  }
  const statut = vue === "traite" ? "traite" : "a-traiter";
  const signalements = await baseDeDonnees.signalementMiamSafe.findMany({
    where: { statut },
    orderBy: { creeLe: statut === "a-traiter" ? "asc" : "desc" },
    take: 300,
    select: {
      id: true, raison: true, explication: true, statut: true, action: true, note: true, creeLe: true, traiteLe: true,
      lieu: { select: { ...LIEU.select, miamSafe: { select: { retireeLe: true } } } },
      // Pour lui répondre (« te dira ce qu'elle a décidé ») : jamais transmis au lieu
      compte: { select: { id: true, prenom: true, email: true } },
    },
  });
  const retard = limiteRetard(maintenant);
  return {
    vue: statut,
    compteurs,
    signalements: signalements.map(({ lieu: { miamSafe, ...lieu }, ...s }) => ({
      ...s,
      lieu: { ...lieu, charteActive: miamSafe !== null && miamSafe.retireeLe === null },
      enRetard: s.statut === "a-traiter" && s.creeLe < retard,
      creeLe: s.creeLe.toISOString(),
      traiteLe: iso(s.traiteLe),
    })),
  };
}

/**
 * Décision sur un signalement Miam Safe. « charte-retiree » retire la charte du lieu (le gérant ne pourra pas la re-signer) ;
 * « lieu-masque » retire en plus la fiche de l'app et du site. null : signalement inconnu ; « deja-traite » : déjà décidé.
 */
export async function deciderSignalementMiamSafe(id: number, decision: { action: ActionMiamSafe; note: string | null }, maintenant = new Date()) {
  return baseDeDonnees.$transaction(async (tx) => {
    const s = await tx.signalementMiamSafe.findUnique({ where: { id }, select: { statut: true, lieuId: true, lieu: { select: { nom: true } } } });
    if (!s) return null;
    if (s.statut === "traite") return "deja-traite" as const;
    await tx.signalementMiamSafe.update({ where: { id }, data: { statut: "traite", action: decision.action, note: decision.note, traiteLe: maintenant } });
    if (decision.action === "charte-retiree" || decision.action === "lieu-masque") {
      const motif = `Signalement Miam Safe n° ${id}`;
      await tx.charteMiamSafe.updateMany({ where: { lieuId: s.lieuId }, data: { retireeLe: maintenant, motifRetrait: motif } });
    }
    if (decision.action === "lieu-masque") await tx.lieu.update({ where: { id: s.lieuId }, data: { statut: "masque" } });
    return { lieuId: s.lieuId, lieu: s.lieu.nom };
  });
}

/** L'équipe a vu une alerte sans réponse (et fait le nécessaire : appel au lieu…) : elle sort de la liste */
export async function marquerAlerteMiamSafeVue(id: number, maintenant = new Date()): Promise<boolean> {
  const { count } = await baseDeDonnees.alerteMiamSafe.updateMany({ where: { id, vueLe: null }, data: { vueLe: maintenant } });
  return count > 0;
}

/** Rendre sa charte à un lieu (après échange avec lui) : il peut de nouveau la signer depuis l'espace pro */
export async function rendreCharteMiamSafe(lieuId: number): Promise<boolean> {
  const { count } = await baseDeDonnees.charteMiamSafe.updateMany({ where: { lieuId, motifRetrait: { not: null } }, data: { motifRetrait: null } });
  return count > 0;
}

/**
 * Ménage de nuit (taches-de-nuit.ts), promis par la politique de confidentialité : les signalements Miam Safe traités depuis
 * plus d'un an, et les alertes silencieuses de plus de 30 jours (aussi effacées à chaque nouvelle alerte).
 */
export async function effacerMiamSafeAncien(maintenant = new Date()) {
  const unAn = new Date(maintenant);
  unAn.setFullYear(unAn.getFullYear() - 1);
  const [signalements, alertes] = await Promise.all([
    baseDeDonnees.signalementMiamSafe.deleteMany({ where: { statut: "traite", traiteLe: { lt: unAn } } }),
    baseDeDonnees.alerteMiamSafe.deleteMany({ where: { creeLe: { lt: new Date(maintenant.getTime() - DUREE_GARDE_ALERTES_MS) } } }),
  ]);
  return { signalements: signalements.count, alertes: alertes.count };
}
