import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";

import { calculerDistance } from "~/fonctions/geo/calculer-distance";

/**
 * Distance d'un lieu depuis un point de départ (ta position, ou le centre de ta ville) ; sans point de départ, celle gardée
 * sur le lieu (depuis ta ville, ou sa distance d'exemple en démo). null quand on ne la connaît pas : un lieu pas encore
 * placé sur la carte n'est jamais « près de toi », ni à 0 km.
 */
export function calculerKmLieu(lieu: Lieu, depart: PositionLieu | null): number | null {
  if (depart) return lieu.position ? calculerDistance(depart, lieu.position) : null;
  // Infini (convertirLieuApi), ou null après un passage en JSON : inconnue
  return typeof lieu.km === "number" && Number.isFinite(lieu.km) ? lieu.km : null;
}
