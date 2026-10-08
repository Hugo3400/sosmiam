// Seuils repris de packages/commun/src/regles/ambassadeurs.ts (l'API ne peut pas l'importer) : à garder en phase.
// « ambassadeur-ville » ne s'obtient jamais aux points : seulement à la main, par l'équipe.

export type PalierAuxPoints = "curieux" | "denicheur" | "ambassadeur-quartier";

/** Palier atteint avec ce total de points : curieux dès 0, dénicheur dès 100, ambassadeur de quartier dès 300. */
export function calculerPalierAuxPoints(points: number): PalierAuxPoints {
  if (points >= 300) return "ambassadeur-quartier";
  if (points >= 100) return "denicheur";
  return "curieux";
}
