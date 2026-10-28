import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_LOCALISATION_PAR_LANGUE } from "~/contenus/textes-localisation";

/** « en Occitanie », « dans le Grand Est », « à La Réunion » : la bonne préposition devant le nom d'une région. */
export function direDansRegion(region: string, langue: Langue): string {
  const T = choisirTextes(TEXTES_LOCALISATION_PAR_LANGUE, langue);
  return T.regionsParticulieres[region] ?? T.dansRegion(region);
}
