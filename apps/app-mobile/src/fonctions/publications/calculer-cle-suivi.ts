import type { AuteurPublication } from "~/contenus/type-publication";

/** Clé qui range un auteur dans tes suivis : « lieu:<id> » pour un lieu, « createur:<pseudo> » pour un créateur. */
export function calculerCleSuivi(auteur: AuteurPublication, idLieu: number): string {
  return auteur.type === "lieu" ? `lieu:${idLieu}` : `createur:${auteur.pseudo}`;
}
