import type { TypeOffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";

export function choisirTypeOffre(valeur: string | null): TypeOffreCarriere | null {
  return valeur === "benevolat" || valeur === "freelance" ? valeur : null;
}
