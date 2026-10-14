import type { CarteLieu } from "@sos-miam/commun/types/carte";

/** Âge inconnu (null : visite sans compte, tout public) : retire les boissons alcoolisées de la carte, et les sections qui se retrouvent vides. Avec un compte, la carte reste entière. */
export function filtrerCarteSelonAge(carte: CarteLieu, age: number | null): CarteLieu {
  if (age !== null) return carte;
  const sections = carte.sections
    .map((section) => ({ ...section, elements: section.elements.filter((element) => !element.alcool) }))
    .filter((section) => section.elements.length > 0);
  return { ...carte, sections };
}
