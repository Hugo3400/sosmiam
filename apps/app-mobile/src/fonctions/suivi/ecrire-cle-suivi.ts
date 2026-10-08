import type { CibleSuivi } from "~/fonctions/suivi/lire-cle-suivi";

/** L'inverse de lireCleSuivi : { type: "personne", id: "sofia" } → « personne:sofia », { type: "lieu", id: 12 } → « lieu:12 ». */
export function ecrireCleSuivi(cible: CibleSuivi): string {
  if (cible.type === "lieu") return `lieu:${cible.id}`;
  if (cible.type === "createur") return `createur:${cible.pseudo}`;
  return `personne:${cible.id}`;
}
