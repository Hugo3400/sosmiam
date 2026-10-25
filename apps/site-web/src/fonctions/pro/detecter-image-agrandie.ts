import type { Cadre, Dimensions } from "../../types/images-lieu.ts";

const TOLERANCE_PIXEL = 0.5;

export function detecterImageAgrandie(cadre: Cadre, cible: Dimensions): boolean {
  return cadre.largeur + TOLERANCE_PIXEL < cible.largeur || cadre.hauteur + TOLERANCE_PIXEL < cible.hauteur;
}
