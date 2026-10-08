// Lecture des statistiques de visite pour le logiciel de gestion : totaux par période (avec la période d'avant, pour
// comparer), conversions (inscriptions, demandes de lieux) et classements du détail.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerClesPeriodes } from "../../fonctions/dates/calculer-cles-periodes.ts";
import { listerPeriodes, type Echelle, type Periode } from "../../fonctions/dates/lister-periodes.ts";
import type { DimensionMesure, SourceMesure } from "../mesure.ts";

const DIMENSIONS: DimensionMesure[] = [
  "page", "provenance", "appareil", "navigateur", "systeme", "pays", "entree", "sortie", "campagne", "langue", "region",
  "ville", "creneau", "clic", "robot", "introuvable", "temps", "lente",
];
/** Classements limités aux 20 premières valeurs ; les créneaux (7 jours × 24 heures) sont tous rendus */
const TAILLE_CLASSEMENT = 20;
const UN_JOUR = 86_400_000;

async function lireTotaux(source: SourceMesure, echelle: Echelle, periodes: Periode[]) {
  const lignes = await baseDeDonnees.statPeriode.findMany({
    where: { source, type: echelle, cle: { in: periodes.map((p) => p.cle) } },
    select: { cle: true, vues: true, visites: true, visiteurs: true, visitesFinies: true, rebonds: true, dureeVisites: true, tempsTotal: true, pagesMesurees: true },
  });
  const parCle = new Map(lignes.map((ligne) => [ligne.cle, ligne]));
  return periodes.map((periode) => {
    const l = parCle.get(periode.cle);
    return {
      ...periode,
      vues: l?.vues ?? 0,
      visites: l?.visites ?? 0,
      visiteurs: l?.visiteurs ?? 0,
      visitesFinies: l?.visitesFinies ?? 0,
      rebonds: l?.rebonds ?? 0,
      dureeVisites: l?.dureeVisites ?? 0,
      tempsMoyen: l && l.pagesMesurees > 0 ? Math.round(Number(l.tempsTotal) / l.pagesMesurees) : null,
    };
  });
}

/** Inscriptions à la newsletter et demandes de lieux, rangées par période (heure de Paris). */
async function lireConversions(echelle: Echelle, periodes: Periode[]) {
  const premiere = periodes[0];
  const derniere = periodes[periodes.length - 1];
  if (!premiere || !derniere) return [];
  // Marge d'un jour de chaque côté (fuseau horaire), puis rangement exact par la clé de période
  const depuis = new Date(new Date(`${premiere.debut}T00:00:00Z`).getTime() - UN_JOUR);
  const jusqua = new Date(new Date(`${derniere.fin}T00:00:00Z`).getTime() + 2 * UN_JOUR);
  const [inscriptions, demandes] = await Promise.all([
    baseDeDonnees.inscriptionNewsletter.findMany({ where: { premiereInscription: { gte: depuis, lt: jusqua } }, select: { premiereInscription: true } }),
    baseDeDonnees.demandeLieu.findMany({ where: { creeLe: { gte: depuis, lt: jusqua } }, select: { creeLe: true } }),
  ]);
  const compter = (dates: Date[]) => {
    const parCle = new Map<string, number>();
    for (const date of dates) {
      const cle = calculerClesPeriodes(date)[echelle];
      parCle.set(cle, (parCle.get(cle) ?? 0) + 1);
    }
    return parCle;
  };
  const parInscription = compter(inscriptions.map((i) => i.premiereInscription));
  const parDemande = compter(demandes.map((d) => d.creeLe));
  return periodes.map((p) => ({ cle: p.cle, inscriptions: parInscription.get(p.cle) ?? 0, demandes: parDemande.get(p.cle) ?? 0 }));
}

export async function lireStatistiques(source: SourceMesure, echelle: Echelle, nombre: number, maintenant = new Date()) {
  // Les « nombre » dernières périodes, et les « nombre » d'avant pour comparer
  const toutes = listerPeriodes(echelle, nombre * 2, maintenant);
  const precedentes = toutes.slice(0, nombre);
  const periodes = toutes.slice(nombre);
  const premiere = periodes[0];
  const derniere = periodes[periodes.length - 1];
  if (!premiere || !derniere) return { echelle, periodes: [], precedentes: [], conversions: [], details: {} };

  const [totaux, totauxPrecedents, conversions, groupes] = await Promise.all([
    lireTotaux(source, echelle, periodes),
    lireTotaux(source, echelle, precedentes),
    lireConversions(echelle, periodes),
    baseDeDonnees.statDetail.groupBy({
      by: ["dimension", "valeur"],
      where: { source, jour: { gte: premiere.debut, lte: derniere.fin } },
      _sum: { nombre: true },
    }),
  ]);
  const details: Partial<Record<DimensionMesure, { valeur: string; nombre: number }[]>> = {};
  for (const dimension of DIMENSIONS) {
    const classement = groupes
      .filter((groupe) => groupe.dimension === dimension)
      .map((groupe) => ({ valeur: groupe.valeur, nombre: groupe._sum.nombre ?? 0 }))
      .sort((a, b) => b.nombre - a.nombre);
    details[dimension] = dimension === "creneau" || dimension === "temps" ? classement : classement.slice(0, TAILLE_CLASSEMENT);
  }
  return { echelle, periodes: totaux, precedentes: totauxPrecedents, conversions, details };
}
