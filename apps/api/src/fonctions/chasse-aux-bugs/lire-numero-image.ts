import { IMAGES_SIGNALEMENT_MAX } from "../../../../../packages/commun/src/regles/securite.ts";

export function lireNumeroImage(valeur: unknown): number | null {
  const numero = typeof valeur === "number" ? valeur : typeof valeur === "string" && /^\d$/.test(valeur) ? Number(valeur) : Number.NaN;
  return Number.isInteger(numero) && numero >= 0 && numero < IMAGES_SIGNALEMENT_MAX ? numero : null;
}
