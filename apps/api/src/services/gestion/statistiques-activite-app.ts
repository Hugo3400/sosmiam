// L'activité de l'app, semaine par semaine (12 semaines, à l'heure de Paris), tirée de la base : des NOMBRES seulement
// (demandé par Hugo le 15 octobre 2026). Comptes actifs sur l'app, visites validées, rescousses, avis publiés,
// réservations, sorties créées, messages envoyés (comptés, jamais lus), commentaires ; et les villes où l'on valide le plus.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerClesPeriodes } from "../../fonctions/dates/calculer-cles-periodes.ts";
import { listerPeriodes } from "../../fonctions/dates/lister-periodes.ts";

const SEMAINES = 12;
const VILLES_MAX = 10;
export const MESURES_ACTIVITE_APP = ["visites", "rescousses", "avis", "reservations", "sorties", "messages", "commentaires"] as const;
type Mesure = (typeof MESURES_ACTIVITE_APP)[number];

export async function lireActiviteApp(maintenant = new Date()) {
  const semaines = listerPeriodes("semaine", SEMAINES, maintenant);
  const depuis = new Date(Date.parse(`${semaines[0]!.debut}T00:00:00Z`) - 86_400_000);
  const septJours = new Date(maintenant.getTime() - 7 * 86_400_000);
  const [visites, rescousses, avis, reservations, sorties, messages, commentaires, totaux] = await Promise.all([
    baseDeDonnees.visite.findMany({ where: { statut: "validee", valideLe: { gte: depuis } }, select: { valideLe: true, lieu: { select: { ville: true } } } }),
    baseDeDonnees.rescousse.findMany({ where: { creeLe: { gte: depuis } }, select: { creeLe: true } }),
    baseDeDonnees.avis.findMany({ where: { statut: "publie", creeLe: { gte: depuis } }, select: { creeLe: true } }),
    baseDeDonnees.reservation.findMany({ where: { creeLe: { gte: depuis } }, select: { creeLe: true } }),
    baseDeDonnees.sortie.findMany({ where: { creeLe: { gte: depuis } }, select: { creeLe: true } }),
    baseDeDonnees.messageConversation.findMany({ where: { creeLe: { gte: depuis } }, select: { creeLe: true } }),
    baseDeDonnees.commentairePublication.findMany({ where: { creeLe: { gte: depuis } }, select: { creeLe: true } }),
    Promise.all([
      // Vus sur l'app : une connexion depuis l'app active depuis 7 jours
      baseDeDonnees.compte.count({ where: { sessions: { some: { support: "app", activite: { gte: septJours } } } } }),
      baseDeDonnees.compte.count({ where: { OR: [{ sessions: { some: { support: "app" } } }, { appareils: { some: {} } }] } }),
      baseDeDonnees.visite.count({ where: { statut: "validee" } }),
      baseDeDonnees.rescousse.count(),
      baseDeDonnees.avis.count({ where: { statut: "publie" } }),
    ]),
  ]);
  const parSemaine = new Map(semaines.map((s) => [s.cle, Object.fromEntries(MESURES_ACTIVITE_APP.map((m) => [m, 0])) as Record<Mesure, number>]));
  const ajouter = (mesure: Mesure, date: Date | null) => {
    const ligne = date ? parSemaine.get(calculerClesPeriodes(date).semaine) : undefined;
    if (ligne) ligne[mesure]++;
  };
  for (const v of visites) ajouter("visites", v.valideLe);
  for (const r of rescousses) ajouter("rescousses", r.creeLe);
  for (const a of avis) ajouter("avis", a.creeLe);
  for (const r of reservations) ajouter("reservations", r.creeLe);
  for (const s of sorties) ajouter("sorties", s.creeLe);
  for (const m of messages) ajouter("messages", m.creeLe);
  for (const c of commentaires) ajouter("commentaires", c.creeLe);
  const villes = new Map<string, number>();
  for (const v of visites) villes.set(v.lieu.ville, (villes.get(v.lieu.ville) ?? 0) + 1);
  const [actifsSemaine, surApp, visitesTotal, rescoussesTotal, avisTotal] = totaux;
  return {
    totaux: { actifsSemaine, surApp, visites: visitesTotal, rescousses: rescoussesTotal, avis: avisTotal },
    semaines: semaines.map((s) => ({ cle: s.cle, ...parSemaine.get(s.cle)! })),
    villes: [...villes].sort((a, b) => b[1] - a[1]).slice(0, VILLES_MAX).map(([ville, nombre]) => ({ ville, visites: nombre })),
  };
}
