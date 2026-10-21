import { creerCandidaturesCarriere } from "./carriere-candidatures.ts";
import { creerOffresCarriere } from "./carriere-offres.ts";
import type { DependancesCarriere } from "./carriere-regles.ts";

export function creerCarriere(dependances: DependancesCarriere) {
  return { ...creerOffresCarriere(dependances), ...creerCandidaturesCarriere(dependances) };
}

export type Carriere = ReturnType<typeof creerCarriere>;
