/**
 * Le lieu retenu à la fin du vote : celui qui a le plus de votes (à égalité, celui proposé en premier), ou null s'il n'y a
 * aucune proposition. votes : le nombre de votes (tous, même ceux de personnes que tu ne vois pas).
 */
export function choisirLieuGagnant(propositions: readonly { lieuId: number; votes: number }[]): number | null {
  let gagnante: { lieuId: number; votes: number } | null = null;
  for (const proposition of propositions) {
    if (!gagnante || proposition.votes > gagnante.votes) gagnante = proposition;
  }
  return gagnante?.lieuId ?? null;
}
