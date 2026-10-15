import { BORNES_TRANCHES_AGE } from "../../regles/sorties-miamis.ts";
import type { TrancheAge } from "../../types/sorties-miamis.ts";

export function estDansTrancheAge(age: number, tranche: TrancheAge): boolean {
  const { min, max } = BORNES_TRANCHES_AGE[tranche];
  return age >= min && (max === null || age <= max);
}
