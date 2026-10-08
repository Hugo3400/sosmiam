import { AGE_ALCOOL } from "@sos-miam/commun/regles/ages";
import type { CarteLieu } from "@sos-miam/commun/types/carte";

/** Sous 18 ans (ou âge inconnu, par prudence), retire les boissons alcoolisées de la carte, et les sections qui se retrouvent vides. */
export function filtrerCarteSelonAge(carte: CarteLieu, age: number | null): CarteLieu {
  if (age !== null && age >= AGE_ALCOOL) return carte;
  const sections = carte.sections
    .map((section) => ({ ...section, elements: section.elements.filter((element) => !element.alcool) }))
    .filter((section) => section.elements.length > 0);
  return { ...carte, sections };
}
