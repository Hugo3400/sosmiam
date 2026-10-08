// Le bilan d'un mois (rapport à partager), comparé au mois d'avant : visites du site, inscrits, comptes, ambassadeurs,
// lieux, publications, demandes, missions, BIG SOS, modération, mails et notifications. Mois à l'heure de Paris.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerClesPeriodes } from "../../fonctions/dates/calculer-cles-periodes.ts";

const UN_JOUR = 86_400_000;

/** Le mois d'avant : « 2026-10 » → « 2026-09 » */
const moisPrecedent = (mois: string) => {
  const [a, m] = mois.split("-").map(Number) as [number, number];
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
};

async function chiffresDuMois(mois: string) {
  const [a, m] = mois.split("-").map(Number) as [number, number];
  // Large d'un jour de chaque côté, puis tri exact par la clé du mois (heure de Paris)
  const dans = { gte: new Date(Date.UTC(a, m - 1, 1) - UN_JOUR), lt: new Date(Date.UTC(a, m, 1) + UN_JOUR) };
  const duMois = (date: Date | null) => !!date && calculerClesPeriodes(date).mois === mois;
  const compter = <T,>(lignes: T[], date: (ligne: T) => Date | null) => lignes.filter((ligne) => duMois(date(ligne))).length;
  const [visites, inscrits, comptes, ambassadeurs, lieux, publications, demandes, missions, bigSos, signalements, mails, notifications] = await Promise.all([
    baseDeDonnees.statPeriode.findFirst({ where: { source: "site", type: "mois", cle: mois }, select: { visiteurs: true, visites: true, vues: true } }),
    baseDeDonnees.inscriptionNewsletter.findMany({ where: { premiereInscription: dans }, select: { premiereInscription: true } }),
    baseDeDonnees.compte.findMany({ where: { creeLe: dans }, select: { creeLe: true } }),
    baseDeDonnees.ambassadeur.findMany({ where: { statut: "actif", decideLe: dans }, select: { decideLe: true } }),
    baseDeDonnees.lieu.findMany({ where: { creeLe: dans }, select: { creeLe: true } }),
    baseDeDonnees.publication.findMany({ where: { statut: "publiee", publieeLe: dans }, select: { publieeLe: true } }),
    baseDeDonnees.demandeLieu.findMany({ where: { creeLe: dans }, select: { creeLe: true } }),
    baseDeDonnees.missionAmbassadeur.findMany({ where: { statut: "faite", faiteLe: dans }, select: { faiteLe: true } }),
    baseDeDonnees.bigSos.findMany({
      where: { statut: { in: ["valide", "termine"] }, debutLe: dans },
      select: { debutLe: true, objectifTitre: true, objectifCible: true, objectifAtteint: true, bilan: true, lieu: { select: { nom: true, ville: true } } },
    }),
    baseDeDonnees.signalement.findMany({ where: { traiteLe: dans }, select: { traiteLe: true } }),
    baseDeDonnees.envoiCourriel.findMany({ where: { statut: "envoye", envoyeLe: dans }, select: { envoyeLe: true } }),
    baseDeDonnees.notificationPush.findMany({ where: { statut: "envoyee", envoyeeLe: dans }, select: { envoyeeLe: true, envoyees: true } }),
  ]);
  return {
    mois,
    visiteurs: visites?.visiteurs ?? 0,
    visites: visites?.visites ?? 0,
    vues: visites?.vues ?? 0,
    inscrits: compter(inscrits, (i) => i.premiereInscription),
    comptes: compter(comptes, (c) => c.creeLe),
    ambassadeurs: compter(ambassadeurs, (x) => x.decideLe),
    lieux: compter(lieux, (l) => l.creeLe),
    publications: compter(publications, (p) => p.publieeLe),
    demandes: compter(demandes, (d) => d.creeLe),
    missions: compter(missions, (x) => x.faiteLe),
    signalements: compter(signalements, (s) => s.traiteLe),
    mails: compter(mails, (x) => x.envoyeLe),
    notifications: notifications.filter((n) => duMois(n.envoyeeLe)).reduce((total, n) => total + n.envoyees, 0),
    bigSos: bigSos.filter((b) => duMois(b.debutLe)).map(({ debutLe, ...b }) => ({ ...b, debutLe })),
  };
}

export async function lireBilanMois(mois: string) {
  const [actuel, precedent, totaux] = await Promise.all([
    chiffresDuMois(mois),
    chiffresDuMois(moisPrecedent(mois)),
    Promise.all([
      baseDeDonnees.lieu.count({ where: { statut: "publie" } }),
      baseDeDonnees.inscriptionNewsletter.count(),
      baseDeDonnees.ambassadeur.count({ where: { statut: "actif" } }),
      baseDeDonnees.compte.count(),
    ]),
  ]);
  const [lieuxEnLigne, inscrits, ambassadeursActifs, comptes] = totaux;
  return { actuel, precedent, totaux: { lieuxEnLigne, inscrits, ambassadeursActifs, comptes } };
}
