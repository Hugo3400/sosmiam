import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_LOCALISATION_PAR_LANGUE } from "~/contenus/textes-localisation";

export function ecrireRepliDistances(depuisVille: string | null, langue: Langue): string | null {
  return depuisVille ? choisirTextes(TEXTES_LOCALISATION_PAR_LANGUE, langue).repliDistances(depuisVille) : null;
}
