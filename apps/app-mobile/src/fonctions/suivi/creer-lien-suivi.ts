import type { LienSuivi } from "@sos-miam/commun/types/suivis";

/** Un lien vers cette personne, depuis cette date (ISO) ; surveillance : adulte ↔ créateur de 15-17 ans (gardé pour la future API). */
export function creerLienSuivi(id: string, depuis: string, surveillance?: boolean): LienSuivi {
  return surveillance ? { id, depuis, surveillance: true } : { id, depuis };
}
