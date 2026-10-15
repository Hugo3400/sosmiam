import { regionsFrance } from "@sos-miam/commun/contenus/regions-france";
import type { Lieu } from "@sos-miam/commun/types/lieu";

import type { ZonePortee } from "~/contenus/portee-explorer";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";

/**
 * Vrai si le lieu est dans la zone regardée par Explorer :
 * - à quelques km : à vol d'oiseau depuis ta position ou ta ville ; un lieu dont on ne connaît pas la distance n'y est
 *   jamais (pas encore placé sur la carte, ou on ne sait pas où tu es : ni position, ni ville connue). Sans point de
 *   départ, seule la démo garde ses km d'exemple ; ailleurs, la liste est vide et Explorer dit pourquoi ;
 * - ta région : la région de sa ville si on la connaît, sinon le rectangle de la région (région inconnue : tout passe) ;
 * - toute la France : toujours.
 */
export function estDansPortee(lieu: Lieu, zone: ZonePortee): boolean {
  if (zone.portee === "france") return true;
  if (zone.portee === "proche") {
    const km = calculerKmLieu(lieu, zone.centre);
    return km !== null && km <= zone.rayonKm;
  }
  if (zone.region === null) return true;
  const ville = trouverVilleFrance(lieu.ville);
  if (ville) return ville.region === zone.region;
  const cadre = regionsFrance[zone.region];
  if (!cadre || !lieu.position) return false;
  const { latitude, longitude } = lieu.position;
  return latitude <= cadre.nord && latitude >= cadre.sud && longitude >= cadre.ouest && longitude <= cadre.est;
}
