import { ANNEES_CONSERVATION_SECURITE } from "../../../../../packages/commun/src/regles/securite.ts";

export function calculerEffacementSignalement(clotureLe: Date): Date {
  const effacement = new Date(clotureLe.getTime());
  effacement.setUTCFullYear(effacement.getUTCFullYear() + ANNEES_CONSERVATION_SECURITE);
  return effacement;
}
