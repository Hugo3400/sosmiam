import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_RECHERCHE_COMMUNE_PAR_LANGUE } from "~/contenus/recherche-commune";
import type { ZoneFondateurs } from "~/types/compte";

/**
 * Les places de fondateur d'une zone, en une phrase : « Lyon : 7 places libres sur 10 », « Lyon : les 10 places sont
 * prises », « Avignon : 1 place, encore libre » ; pour une commune de moins de 50 000 habitants, « Ta commune compte avec
 * le Rhône : 1 place, encore libre » (ou « déjà prise »). Espaces insécables comprises.
 */
export function decrirePlacesZone(zone: ZoneFondateurs, langue: Langue): string {
  const T = choisirTextes(TEXTES_RECHERCHE_COMMUNE_PAR_LANGUE, langue).places;
  const debut = T.debut(zone);
  if (zone.places === 1) return T.unePlace(debut, zone.libres > 0);
  if (zone.libres === 0) return T.toutesPrises(debut, zone.places);
  return T.libres(debut, zone.libres, zone.places);
}
