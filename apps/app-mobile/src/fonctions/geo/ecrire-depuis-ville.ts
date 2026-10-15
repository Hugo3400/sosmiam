import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";
import { eliderDe } from "~/fonctions/texte/elider-de";

export function ecrireDepuisVille(nom: string): string | null {
  const ville = trouverVilleFrance(nom);
  return ville ? eliderDe(ville.nom) : null;
}
