// Le calendrier du logiciel de gestion : tout ce qui a une date, au même endroit (publications programmées ou parues,
// notifications, BIG SOS à la une, échéances des missions, newsletters et annonces Discord envoyées).
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

export type EvenementCalendrier = {
  type: "publication" | "notification" | "big-sos" | "mission" | "newsletter" | "annonce";
  id: number;
  /** Début (ou moment) ; fin pour ce qui dure (un BIG SOS à la une) */
  debut: Date;
  fin: Date | null;
  titre: string;
  detail: string;
};

export async function lireCalendrier(debut: Date, fin: Date): Promise<EvenementCalendrier[]> {
  const dans = { gte: debut, lt: fin };
  const [publications, notifications, bigSos, missions, campagnes, annonces] = await Promise.all([
    baseDeDonnees.publication.findMany({
      where: { publieeLe: dans, statut: "publiee" }, take: 300,
      select: { id: true, publieeLe: true, legende: true, lieu: { select: { nom: true, emoji: true } } },
    }),
    baseDeDonnees.notificationPush.findMany({ where: { programmeeLe: dans, statut: { not: "annulee" } }, take: 300, select: { id: true, programmeeLe: true, titre: true, statut: true, description: true } }),
    baseDeDonnees.bigSos.findMany({
      where: { statut: { in: ["valide", "termine"] }, debutLe: { lt: fin }, finLe: { gt: debut } }, take: 100,
      select: { id: true, debutLe: true, finLe: true, lieu: { select: { nom: true, emoji: true } } },
    }),
    baseDeDonnees.missionAmbassadeur.findMany({
      where: { echeance: dans, statut: { not: "annulee" } }, take: 300,
      select: { id: true, echeance: true, titre: true, statut: true, compte: { select: { id: true, prenom: true } } },
    }),
    baseDeDonnees.campagneNewsletter.findMany({ where: { creeLe: dans }, take: 100, select: { id: true, creeLe: true, objet: true, total: true } }),
    baseDeDonnees.annonceDiscord.findMany({ where: { OR: [{ publieeLe: dans }, { publieeLe: null, creeLe: dans }] }, take: 100, select: { id: true, titre: true, publieeLe: true, creeLe: true } }),
  ]);
  return [
    ...publications.map((p) => ({ type: "publication" as const, id: p.id, debut: p.publieeLe!, fin: null, titre: `${p.lieu.emoji} ${p.lieu.nom}`, detail: p.legende.slice(0, 80) })),
    ...notifications.map((n) => ({ type: "notification" as const, id: n.id, debut: n.programmeeLe, fin: null, titre: n.titre, detail: `${n.description} · ${n.statut}` })),
    ...bigSos.map((b) => ({ type: "big-sos" as const, id: b.id, debut: b.debutLe!, fin: b.finLe, titre: `${b.lieu.emoji} ${b.lieu.nom}`, detail: "BIG SOS à la une" })),
    // L'échéance d'une mission est la fin d'une journée : elle compte pour ce jour-là
    ...missions.map((m) => ({ type: "mission" as const, id: m.compte.id, debut: m.echeance!, fin: null, titre: m.titre, detail: `${m.compte.prenom} · ${m.statut === "faite" ? "faite" : "à faire"}` })),
    ...campagnes.map((c) => ({ type: "newsletter" as const, id: c.id, debut: c.creeLe, fin: null, titre: c.objet, detail: `${c.total} destinataire(s)` })),
    ...annonces.map((a) => ({ type: "annonce" as const, id: a.id, debut: a.publieeLe ?? a.creeLe, fin: null, titre: a.titre, detail: "Annonce Discord" })),
  ].sort((a, b) => a.debut.getTime() - b.debut.getTime());
}
