import type { Cadre } from "../../types/images-lieu.ts";

export function recentrerCadre(cadre: Cadre, rapport: number): Cadre {
  if (cadre.largeur / cadre.hauteur > rapport) {
    const largeur = cadre.hauteur * rapport;
    return { x: cadre.x + (cadre.largeur - largeur) / 2, y: cadre.y, largeur, hauteur: cadre.hauteur };
  }
  const hauteur = cadre.largeur / rapport;
  return { x: cadre.x, y: cadre.y + (cadre.hauteur - hauteur) / 2, largeur: cadre.largeur, hauteur };
}
