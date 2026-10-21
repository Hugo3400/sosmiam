import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";
import { direDeVille } from "~/fonctions/geo/dire-de-ville";

export function ecrireDepuisVille(nom: string): string | null {
  const ville = trouverVilleFrance(nom);
  return ville ? direDeVille(ville.nom) : null;
}
