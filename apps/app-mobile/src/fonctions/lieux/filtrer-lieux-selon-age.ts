import type { Lieu } from "@sos-miam/commun/types/lieu";

/** Âge inconnu (null : visite sans compte, tout public) : retire les bars. Avec un compte (18 ans ou plus), tout reste. */
export function filtrerLieuxSelonAge(lieux: Lieu[], age: number | null): Lieu[] {
  if (age !== null) return lieux;
  return lieux.filter((lieu) => lieu.type !== "bar");
}
