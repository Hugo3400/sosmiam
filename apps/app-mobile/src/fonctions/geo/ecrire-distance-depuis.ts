import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_LOCALISATION_PAR_LANGUE } from "~/contenus/textes-localisation";
import { formaterDistanceLangue } from "~/fonctions/langue/formater-distance-langue";

export function ecrireDistanceDepuis(km: number, depuis: string | null, langue: Langue): string {
  const distance = formaterDistanceLangue(km, langue);
  return depuis ? choisirTextes(TEXTES_LOCALISATION_PAR_LANGUE, langue).distanceDepuis(distance, depuis) : distance;
}
