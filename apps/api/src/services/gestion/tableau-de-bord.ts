// Vue d'ensemble du logiciel de gestion : quelques chiffres de chaque partie, en une seule demande.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { listerPeriodes } from "../../fonctions/dates/lister-periodes.ts";
import { RAISONS_AVEC_MASQUAGE_IMMEDIAT } from "./moderation.ts";

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
    lieux: compter(lieux),
    publications: { ...compter(publications), programmees },
    journal,
  };
}
