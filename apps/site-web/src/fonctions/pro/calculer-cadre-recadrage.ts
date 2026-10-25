import type { Cadre, Dimensions, ReglageRecadrage } from "../../types/images-lieu.ts";

export const ZOOM_MAX_RECADRAGE = 4;

const borner = (valeur: number, min: number, max: number, defaut: number) => (Number.isFinite(valeur) ? Math.min(max, Math.max(min, valeur)) : defaut);

export function calculerCadreRecadrage(source: Dimensions, cible: Dimensions, reglage: ReglageRecadrage): Cadre {
  const rapport = cible.largeur / cible.hauteur;
  const zoom = borner(reglage.zoom, 1, ZOOM_MAX_RECADRAGE, 1);
  const pleineLargeur = source.largeur / source.hauteur > rapport ? source.hauteur * rapport : source.largeur;
  const largeur = pleineLargeur / zoom;
  const hauteur = largeur / rapport;
  return {
    x: (source.largeur - largeur) * borner(reglage.x, 0, 1, 0.5),
    y: (source.hauteur - hauteur) * borner(reglage.y, 0, 1, 0.5),
    largeur,
    hauteur,
  };
}
