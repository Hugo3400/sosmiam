import type { LienSuivi } from "@sos-miam/commun/types/suivis";

/** Un lien vers cette personne, depuis cette date (ISO). */
export function creerLienSuivi(id: string, depuis: string): LienSuivi {
  return { id, depuis };
}
