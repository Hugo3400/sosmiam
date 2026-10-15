import type { Lieu } from "@sos-miam/commun/types/lieu";

import { estLieuPourBoire } from "~/fonctions/lieux/est-lieu-pour-boire";

export function filtrerLieuxSelonAge(lieux: Lieu[], age: number | null): Lieu[] {
  if (age !== null) return lieux;
  return lieux.filter((lieu) => !estLieuPourBoire(lieu));
}
