import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";

import { calculerDistance } from "~/fonctions/geo/calculer-distance";

/** Distance d'un lieu depuis un point de départ (ta position, ou le centre de ta ville) ; sans point de départ, sa distance d'exemple. */
export function calculerKmLieu(lieu: Lieu, depart: PositionLieu | null): number {
  return depart && lieu.position ? calculerDistance(depart, lieu.position) : lieu.km;
}
