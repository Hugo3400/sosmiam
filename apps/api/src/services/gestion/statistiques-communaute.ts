// Statistiques de la communauté, semaine par semaine (12 semaines, à l'heure de Paris) : comptes créés, ambassadeurs
// validés, lieux proposés par les ambassadeurs, missions faites, BIG SOS mis à la une, mails et notifications envoyés.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerClesPeriodes } from "../../fonctions/dates/calculer-cles-periodes.ts";
import { listerPeriodes } from "../../fonctions/dates/lister-periodes.ts";

const SEMAINES = 12;
export const MESURES_COMMUNAUTE = ["comptes", "ambassadeurs", "lieuxProposes", "missions", "bigSos", "mails", "notifications"] as const;
type Mesure = (typeof MESURES_COMMUNAUTE)[number];

export async function lireStatistiquesCommunaute(maintenant = new Date()) {
  const semaines = listerPeriodes("semaine", SEMAINES, maintenant);
  // Une marge d'un jour avant le premier lundi : le tri exact se fait ensuite par la clé de semaine (heure de Paris)
  const depuis = new Date(Date.parse(`${semaines[0]!.debut}T00:00:00Z`) - 86_400_000);
  const [comptes, ambassadeurs, lieuxProposes, missions, bigSos, mails, notifications, totaux] = await Promise.all([
    baseDeDonnees.compte.findMany({ where: { creeLe: { gte: depuis } }, select: { creeLe: true } }),
    baseDeDonnees.ambassadeur.findMany({ where: { statut: "actif", decideLe: { gte: depuis } }, select: { decideLe: true } }),
    baseDeDonnees.demandeLieu.findMany({ where: { compteId: { not: null }, creeLe: { gte: depuis } }, select: { creeLe: true } }),
    baseDeDonnees.missionAmbassadeur.findMany({ where: { statut: "faite", faiteLe: { gte: depuis } }, select: { faiteLe: true } }),
    baseDeDonnees.bigSos.findMany({ where: { statut: { in: ["valide", "termine"] }, debutLe: { gte: depuis, lte: maintenant } }, select: { debutLe: true } }),
    baseDeDonnees.envoiCourriel.findMany({ where: { statut: "envoye", envoyeLe: { gte: depuis } }, select: { envoyeLe: true } }),
    baseDeDonnees.notificationPush.findMany({ where: { statut: "envoyee", envoyeeLe: { gte: depuis } }, select: { envoyeeLe: true, envoyees: true } }),
    Promise.all([
      baseDeDonnees.compte.count(),
      baseDeDonnees.ambassadeur.count({ where: { statut: "actif" } }),
      baseDeDonnees.missionAmbassadeur.count({ where: { statut: "faite" } }),
      baseDeDonnees.bigSos.count({ where: { statut: { in: ["valide", "termine"] }, debutLe: { lte: maintenant } } }),
      baseDeDonnees.appareilPush.count({ where: { actif: true } }),
    ]),
  ]);
  const parSemaine = new Map(semaines.map((s) => [s.cle, Object.fromEntries(MESURES_COMMUNAUTE.map((m) => [m, 0])) as Record<Mesure, number>]));
  const ajouter = (mesure: Mesure, date: Date | null, nombre = 1) => {
    const ligne = date ? parSemaine.get(calculerClesPeriodes(date).semaine) : undefined;
    if (ligne) ligne[mesure] += nombre;
  };
  for (const c of comptes) ajouter("comptes", c.creeLe);
  for (const a of ambassadeurs) ajouter("ambassadeurs", a.decideLe);
  for (const l of lieuxProposes) ajouter("lieuxProposes", l.creeLe);
  for (const m of missions) ajouter("missions", m.faiteLe);
  for (const b of bigSos) ajouter("bigSos", b.debutLe);
  for (const m of mails) ajouter("mails", m.envoyeLe);
  for (const n of notifications) ajouter("notifications", n.envoyeeLe, n.envoyees);
  const [comptesTotal, ambassadeursActifs, missionsFaites, bigSosTotal, telephones] = totaux;
  return {
    totaux: { comptes: comptesTotal, ambassadeursActifs, missionsFaites, bigSos: bigSosTotal, telephones },
    semaines: semaines.map((s) => ({ cle: s.cle, ...parSemaine.get(s.cle)! })),
  };
}
