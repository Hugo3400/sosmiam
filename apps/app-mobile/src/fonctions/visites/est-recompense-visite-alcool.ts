import type { ResultatValidation } from "@sos-miam/commun/types/visite";

/**
 * Vrai si la récompense dont parle la célébration est la version avec alcool : celle qu'on vient de gagner (carte pleine,
 * alcool figé au moment du gain), sinon celle vers laquelle on avance. Le message sanitaire va alors avec.
 */
export function estRecompenseVisiteAlcool(r: ResultatValidation): boolean {
  const carte = r.carte;
  if (!carte) return false;
  const gagnee = r.recompenseGagnee ? carte.pretes[carte.pretes.length - 1] : undefined;
  return gagnee ? gagnee.alcool === true : carte.recompenseAlcool;
}
