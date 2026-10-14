import { AGES_MAJORITE, PAYS_PAR_DEFAUT } from "./ages.ts";

/** L'âge de la majorité d'un pays (code ISO 3166-1 alpha-2, la France par défaut) ; null : l'app n'y est pas ouverte. */
export function lireAgeMajorite(pays: string = PAYS_PAR_DEFAUT): number | null {
  return AGES_MAJORITE[pays.trim().toUpperCase()] ?? null;
}
