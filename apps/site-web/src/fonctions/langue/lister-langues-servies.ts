import { LANGUES, LANGUES_OUVERTES_SITE, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { estHoteDEssai } from "~/fonctions/hotes/est-hote-d-essai";

export function listerLanguesServies(hote: string, ouvertes: readonly Langue[] = LANGUES_OUVERTES_SITE): readonly Langue[] {
  return estHoteDEssai(hote) ? LANGUES : ouvertes;
}
