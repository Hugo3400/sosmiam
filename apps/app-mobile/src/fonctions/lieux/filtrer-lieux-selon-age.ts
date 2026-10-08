import { AGE_ALCOOL } from "@sos-miam/commun/regles/ages";
import type { Lieu } from "@sos-miam/commun/types/lieu";

/** Sous 18 ans (ou âge inconnu, par prudence), retire les bars : pas de lieu centré sur l'alcool. */
export function filtrerLieuxSelonAge(lieux: Lieu[], age: number | null): Lieu[] {
  if (age !== null && age >= AGE_ALCOOL) return lieux;
  return lieux.filter((lieu) => lieu.type !== "bar");
}
