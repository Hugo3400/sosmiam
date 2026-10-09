import { calculerClesPeriodes } from "../dates/calculer-cles-periodes.ts";

/** Une visite décidée par un lieu, telle que la surveillance la lit (jamais la position ni le code). « retiree » : validée
 * puis annulée par le lieu dans les 15 minutes, comptée comme un refus. */
export type VisiteDecidee = { compteId: number; lieuId: number; statut: "validee" | "refusee" | "retiree"; valideLe: Date | null };
export type SeuilsComptes = { parJour: number; partRefusMin: number; decisionsMin: number };
export type RaisonCompte =
  | { type: "par-jour"; jour: string; validees: number }
  | { type: "refus"; refusees: number; decidees: number; part: number; lieux: number };

/** Un compte n'est signalé pour ses refus que si au moins 2 lieux différents l'ont refusé (décidé le 9 octobre 2026) */
const LIEUX_REFUS_MIN = 2;

/**
 * Les comptes à regarder de près (jamais bloqués : l'équipe décide), d'après leurs visites décidées : plus de `parJour`
 * visites validées dans une même journée (jour de Paris), ou une part de refus d'au moins `partRefusMin` % sur au moins
 * `decisionsMin` visites décidées, avec des refus venant d'au moins 2 lieux différents (« au moins 2 gérants » : un seul
 * lieu ne suffit jamais à signaler quelqu'un). Rend chaque compte avec ses raisons.
 */
export function repererComptesLouches(visites: VisiteDecidee[], seuils: SeuilsComptes): Map<number, RaisonCompte[]> {
  const parCompte = new Map<number, VisiteDecidee[]>();
  for (const visite of visites) parCompte.set(visite.compteId, [...(parCompte.get(visite.compteId) ?? []), visite]);
  const louches = new Map<number, RaisonCompte[]>();
  for (const [compteId, siennes] of parCompte) {
    const raisons: RaisonCompte[] = [];
    const parJour = new Map<string, number>();
    for (const visite of siennes) {
      if (visite.statut !== "validee" || !visite.valideLe) continue;
      const jour = calculerClesPeriodes(visite.valideLe).jour;
      parJour.set(jour, (parJour.get(jour) ?? 0) + 1);
    }
    for (const [jour, validees] of parJour) if (validees > seuils.parJour) raisons.push({ type: "par-jour", jour, validees });
    const refusees = siennes.filter((visite) => visite.statut !== "validee");
    const part = siennes.length ? Math.round((refusees.length / siennes.length) * 100) : 0;
    const lieux = new Set(refusees.map((visite) => visite.lieuId)).size;
    if (siennes.length >= seuils.decisionsMin && part >= seuils.partRefusMin && lieux >= LIEUX_REFUS_MIN) {
      raisons.push({ type: "refus", refusees: refusees.length, decidees: siennes.length, part, lieux });
    }
    if (raisons.length) louches.set(compteId, raisons);
  }
  return louches;
}
