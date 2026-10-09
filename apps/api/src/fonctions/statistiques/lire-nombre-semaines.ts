import { SEMAINES_STATISTIQUES_DEFAUT, SEMAINES_STATISTIQUES_MAX } from "../../../../../packages/commun/src/types/statistiques-lieu.ts";

/** Le nombre de semaines demandé (?semaines=) : 8 sans rien, sinon un entier de 1 à 26 ; null s'il ne va pas (vide, répété…) */
export function lireNombreSemaines(brut: unknown): number | null {
  if (brut === undefined) return SEMAINES_STATISTIQUES_DEFAUT;
  if (typeof brut !== "string" || !/^\d{1,2}$/.test(brut)) return null;
  const nombre = Number(brut);
  return nombre >= 1 && nombre <= SEMAINES_STATISTIQUES_MAX ? nombre : null;
}
