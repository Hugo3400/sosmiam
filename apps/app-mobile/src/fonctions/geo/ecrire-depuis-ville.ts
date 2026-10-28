import type { Langue } from "@sos-miam/commun/regles/langues";
import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";
import { direDeVille } from "~/fonctions/geo/dire-de-ville";

export function ecrireDepuisVille(nom: string, langue: Langue): string | null {
  const ville = trouverVilleFrance(nom);
  return ville ? direDeVille(ville.nom, langue) : null;
}
