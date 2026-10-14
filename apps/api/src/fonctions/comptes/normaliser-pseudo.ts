/**
 * Pseudo nettoyé (sans espaces autour, sans « @ » devant, en minuscules), ou "" si ce n'est pas un texte : la forme sous
 * laquelle un pseudo est gardé, cherché et réservé. La forme permise se vérifie à part (estPseudoValide, packages/commun).
 */
export function normaliserPseudo(valeur: unknown): string {
  return typeof valeur === "string" ? valeur.trim().replace(/^@/, "").toLowerCase() : "";
}
