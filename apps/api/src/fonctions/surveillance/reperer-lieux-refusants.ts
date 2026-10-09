/** Une décision d'un lieu sur une visite */
export type DecisionLieu = { lieuId: number; statut: "validee" | "refusee" };

/**
 * Les lieux qui refusent beaucoup (le taux de refus des lieux est surveillé, décidé le 9 octobre 2026) : une part de refus
 * d'au moins `partRefusMin` % sur au moins `decisionsMin` visites décidées. Du plus refusant au moins refusant.
 */
export function repererLieuxRefusants(decisions: DecisionLieu[], seuils: { partRefusMin: number; decisionsMin: number }) {
  const parLieu = new Map<number, { refusees: number; decidees: number }>();
  for (const { lieuId, statut } of decisions) {
    const compte = parLieu.get(lieuId) ?? { refusees: 0, decidees: 0 };
    compte.decidees++;
    if (statut === "refusee") compte.refusees++;
    parLieu.set(lieuId, compte);
  }
  return [...parLieu.entries()]
    .map(([lieuId, { refusees, decidees }]) => ({ lieuId, refusees, decidees, part: Math.round((refusees / decidees) * 100) }))
    .filter((lieu) => lieu.decidees >= seuils.decisionsMin && lieu.part >= seuils.partRefusMin)
    .sort((a, b) => b.part - a.part || b.decidees - a.decidees);
}
