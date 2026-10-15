import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";

import { calculerDistance } from "~/fonctions/geo/calculer-distance";
import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";

/**
 * La distance qui sert seulement à CLASSER un lieu (fil « Pour toi », Explorer « selon tes envies ») : jamais affichée.
 * Sa vraie distance si on la connaît (calculerKmLieu) ; un lieu pas encore placé sur la carte est estimé au centre de sa
 * ville, depuis le point de départ. null si même ça, on ne le sait pas (ville inconnue, ou pas de point de départ) :
 * calculerScoreLieu le met alors après tous les lieux dont on sait où ils sont.
 */
export function estimerKmPourClasser(lieu: Lieu, depart: PositionLieu | null): number | null {
  const km = calculerKmLieu(lieu, depart);
  if (km !== null || !depart || lieu.position) return km;
  const ville = trouverVilleFrance(lieu.ville);
  return ville ? calculerDistance(depart, ville) : null;
}
