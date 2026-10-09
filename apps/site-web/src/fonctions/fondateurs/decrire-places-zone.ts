import { ecrireNomAvecArticle } from "~/fonctions/fondateurs/ecrire-nom-avec-article";
import type { ZoneFondateurs } from "~/types/compte";

/**
 * Les places de fondateur d'une zone, en une phrase : « Lyon : 7 places libres sur 10 », « Lyon : les 10 places sont
 * prises », « Avignon : 1 place, encore libre » ; pour une commune de moins de 50 000 habitants, « Ta commune compte avec
 * le Rhône : 1 place, encore libre » (ou « déjà prise »). Espaces insécables comprises.
 */
export function decrirePlacesZone(zone: ZoneFondateurs): string {
  const debut = zone.type === "departement" ? `Ta commune compte avec ${ecrireNomAvecArticle(zone.nomAvecDe, zone.nom)}` : zone.nom;
  if (zone.places === 1) return `${debut} : 1 place, ${zone.libres > 0 ? "encore libre" : "déjà prise"}`;
  if (zone.libres === 0) return `${debut} : les ${zone.places} places sont prises`;
  const libres = zone.libres > 1 ? `${zone.libres} places libres` : "1 place libre";
  return `${debut} : ${libres} sur ${zone.places}`;
}
