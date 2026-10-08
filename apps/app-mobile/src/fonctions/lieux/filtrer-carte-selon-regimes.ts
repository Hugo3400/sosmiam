import type { CarteLieu } from "@sos-miam/commun/types/carte";
import { regimesCarte } from "~/contenus/regimes-carte";

/**
 * Ne garde que les éléments compatibles avec tous les régimes donnés (végétarien → végé ou vegan, vegan → vegan,
 * sans gluten → sans gluten), d'après les repères indiqués par le lieu, puis retire les sections devenues vides.
 * Les régimes que la carte ne connaît pas sont ignorés ; sans régime connu, la carte revient telle quelle.
 */
export function filtrerCarteSelonRegimes(carte: CarteLieu, regimes: string[]): CarteLieu {
  const exigences = regimes.flatMap((regime) => {
    const regle = regimesCarte[regime];
    return regle ? [regle.etiquettes] : [];
  });
  if (exigences.length === 0) return carte;
  const sections = carte.sections
    .map((section) => ({
      ...section,
      elements: section.elements.filter((element) => exigences.every((acceptees) => acceptees.some((etiquette) => element.etiquettes?.includes(etiquette)))),
    }))
    .filter((section) => section.elements.length > 0);
  return { ...carte, sections };
}
