import type { Dimensions, ReglageRecadrage } from "../../types/images-lieu.ts";
import { calculerCadreRecadrage } from "./calculer-cadre-recadrage.ts";

const MARGE_IMMOBILE = 0.5;

const placer = (debut: number, libre: number) => (libre > MARGE_IMMOBILE ? Math.min(1, Math.max(0, debut / libre)) : 0.5);

export function deplacerReglageRecadrage(source: Dimensions, cible: Dimensions, reglage: ReglageRecadrage, decalage: { x: number; y: number }): ReglageRecadrage {
  const cadre = calculerCadreRecadrage(source, cible, reglage);
  return {
    zoom: reglage.zoom,
    x: placer(cadre.x + decalage.x, source.largeur - cadre.largeur),
    y: placer(cadre.y + decalage.y, source.hauteur - cadre.hauteur),
  };
}
