import { FORME_ID_PUBLIC } from "../../../../../packages/commun/src/regles/potes.ts";

/** L'identifiant public d'une adresse ou d'un corps (`:personne`, une liste d'invités…), ou null s'il n'en a pas la forme */
export function lireIdentifiantPublic(brut: unknown): string | null {
  return typeof brut === "string" && FORME_ID_PUBLIC.test(brut) ? brut : null;
}
