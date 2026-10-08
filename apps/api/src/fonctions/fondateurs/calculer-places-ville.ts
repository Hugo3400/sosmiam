// Places de fondateurs d'une ville (décision « Fondateurs par ville » du 9 octobre 2026, docs/decisions.md), selon la
// population municipale de l'Insee. Seuils inclusifs : 500 000 habitants pile donnent 10 places, 200 000 en donnent 5,
// 100 000 en donnent 3 et 50 000 en donnent 1.

/**
 * Nombre de places de fondateurs d'une commune : 10, 5, 3 ou 1. Sous 50 000 habitants : 0, la commune n'est pas une
 * zone à elle seule et compte dans la zone de son département (1 place pour toutes ses petites communes).
 */
export function calculerPlacesVille(population: number): number {
  if (population >= 500_000) return 10;
  if (population >= 200_000) return 5;
  if (population >= 100_000) return 3;
  if (population >= 50_000) return 1;
  return 0;
}
