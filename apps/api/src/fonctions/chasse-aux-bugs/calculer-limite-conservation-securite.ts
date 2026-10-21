import { ANNEES_CONSERVATION_SECURITE } from "../../../../../packages/commun/src/regles/securite.ts";

export function calculerLimiteConservationSecurite(maintenant: Date): Date {
  const limite = new Date(maintenant.getTime());
  limite.setUTCFullYear(limite.getUTCFullYear() - ANNEES_CONSERVATION_SECURITE);
  return limite;
}
