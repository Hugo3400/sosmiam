import type { PropositionSortie } from "@sos-miam/commun/types/potes";

/** Le lieu qui a le plus de votes (à égalité, celui proposé en premier), ou null s'il n'y a aucune proposition. */
export function choisirLieuGagnant(propositions: PropositionSortie[]): number | null {
  let gagnante: PropositionSortie | null = null;
  for (const proposition of propositions) {
    if (!gagnante || proposition.votes.length > gagnante.votes.length) gagnante = proposition;
  }
  return gagnante?.lieuId ?? null;
}
