// Vue d'ensemble du logiciel de gestion : quelques chiffres de chaque partie, en une seule demande.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerClesPeriodes } from "../../fonctions/dates/calculer-cles-periodes.ts";
import { listerPeriodes } from "../../fonctions/dates/lister-periodes.ts";
import { RAISONS_AVEC_MASQUAGE_IMMEDIAT } from "./moderation.ts";
import { lireObjectifMois } from "./reglages.ts";

const UN_JOUR = 86_400_000;

export async function lireTableauDeBord(maintenant = new Date()) {
  const jours = listerPeriodes("jour", 14, maintenant);
  const ilYa7Jours = new Date(maintenant.getTime() - 7 * UN_JOUR);
  const [
    visitesJours,
    semaine,
    inscrits,
    inscritsRecents,
    ambassadeurs,
    aModerer,
    urgents,
    beta,
    demandes,
    objectif,
    mois,
    inscritsDuMois,
    ambassadeursEnAttente,
    candidaturesEnAttente,
    missionsEnRetard,
    lieux,
    publications,
    programmees,
    journal,
  ] = await Promise.all([
    baseDeDonnees.statPeriode.findMany({
      where: { source: "site", type: "jour", cle: { in: jours.map((j) => j.cle) } },
      select: { cle: true, vues: true, visites: true, visiteurs: true },
    }),
    baseDeDonnees.statPeriode.findMany({
      where: { source: "site", type: "semaine", cle: { in: listerPeriodes("semaine", 1, maintenant).map((s) => s.cle) } },
      select: { vues: true, visites: true, visiteurs: true },
    }),
    baseDeDonnees.inscriptionNewsletter.count(),
    baseDeDonnees.inscriptionNewsletter.count({ where: { premiereInscription: { gte: ilYa7Jours } } }),
    baseDeDonnees.inscriptionNewsletter.count({ where: { ambassadeur: true } }),
    baseDeDonnees.signalement.count({ where: { statut: "a-traiter" } }),
    baseDeDonnees.signalement.count({ where: { statut: "a-traiter", raison: { in: RAISONS_AVEC_MASQUAGE_IMMEDIAT } } }),
    baseDeDonnees.inscriptionNewsletter.count({ where: { beta: true } }),
    baseDeDonnees.demandeLieu.count({ where: { statut: "a-traiter" } }),
    lireObjectifMois(),
    baseDeDonnees.statPeriode.findMany({ where: { source: "site", type: "mois", cle: listerPeriodes("mois", 1, maintenant)[0]?.cle ?? "" }, select: { vues: true, visiteurs: true } }),
    // Inscrits du mois en cours, à l'heure de Paris (marge d'un jour, puis tri exact par la clé du mois)
    baseDeDonnees.inscriptionNewsletter
      .findMany({ where: { premiereInscription: { gte: new Date(Date.parse(`${listerPeriodes("mois", 1, maintenant)[0]?.debut}T00:00:00Z`) - UN_JOUR) } }, select: { premiereInscription: true } })
      .then((liste) => liste.filter((i) => calculerClesPeriodes(i.premiereInscription).mois === calculerClesPeriodes(maintenant).mois).length),
    baseDeDonnees.ambassadeur.count({ where: { statut: "en-attente" } }),
    baseDeDonnees.candidatureFondateur.count({ where: { statut: "en-attente" } }),
    baseDeDonnees.missionAmbassadeur.count({ where: { statut: "a-faire", echeance: { lt: maintenant } } }),
    baseDeDonnees.lieu.groupBy({ by: ["statut"], _count: { _all: true } }),
    baseDeDonnees.publication.groupBy({ by: ["statut"], _count: { _all: true } }),
    baseDeDonnees.publication.count({ where: { statut: "publiee", publieeLe: { gt: maintenant } } }),
    baseDeDonnees.journalGestion.findMany({ orderBy: { id: "desc" }, take: 6 }),
  ]);
  const parJour = new Map(visitesJours.map((ligne) => [ligne.cle, ligne]));
  const compter = (groupes: { statut: string; _count: { _all: number } }[]) =>
    Object.fromEntries(groupes.map((groupe) => [groupe.statut, groupe._count._all]));
  return {
    visites: {
      jours: jours.map((jour) => ({ cle: jour.cle, vues: parJour.get(jour.cle)?.vues ?? 0, visites: parJour.get(jour.cle)?.visites ?? 0, visiteurs: parJour.get(jour.cle)?.visiteurs ?? 0 })),
      semaine: semaine[0] ?? { vues: 0, visites: 0, visiteurs: 0 },
    },
    newsletter: { inscrits, recents: inscritsRecents, ambassadeurs, beta },
    moderation: { aTraiter: aModerer, urgents },
    demandes: { aTraiter: demandes },
    ambassadeurs: { enAttente: ambassadeursEnAttente, candidatures: candidaturesEnAttente, missionsEnRetard },
    objectif: objectif
      ? {
          ...objectif,
          atteint: objectif.mesure === "inscriptions" ? inscritsDuMois : objectif.mesure === "vues" ? (mois[0]?.vues ?? 0) : (mois[0]?.visiteurs ?? 0),
          mois: listerPeriodes("mois", 1, maintenant)[0] ?? null,
        }
      : null,
    lieux: compter(lieux),
    publications: { ...compter(publications), programmees },
    journal,
  };
}
