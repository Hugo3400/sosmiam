import type { ZoneGeo } from "@sos-miam/commun/contenus/regions-france";
import type { PositionLieu } from "@sos-miam/commun/types/lieu";

import { arrondirZoneALaGrille } from "~/fonctions/geo/arrondir-zone-a-la-grille";

/** Un degré de latitude fait environ 111 km partout */
const KM_PAR_DEGRE = 111.2;

/**
 * La zone à demander au serveur pour avoir tous les lieux à « rayonKm » autour d'un point (ta position, ta ville, une
 * ville choisie) : les cases de la grille (arrondirZoneALaGrille) qui couvrent ce rayon autour de N'IMPORTE QUEL point de
 * la case où il est. Deux points de la même case demandent donc exactement la même zone : le serveur sait au mieux dans
 * quelle case de 0,5 degré tu es, jamais où.
 */
export function calculerZoneAutour(centre: PositionLieu, rayonKm: number, pas = 0.5): ZoneGeo {
  const sudCase = Math.floor(centre.latitude / pas) * pas;
  const ouestCase = Math.floor(centre.longitude / pas) * pas;
  const demiLatitude = rayonKm / KM_PAR_DEGRE;
  const nord = sudCase + pas + demiLatitude;
  const sud = sudCase - demiLatitude;
  // Un degré de longitude rétrécit loin de l'équateur : on prend le bord le plus éloigné, pour couvrir le rayon partout
  const latitudeLaPlusLoin = Math.min(89, Math.max(Math.abs(nord), Math.abs(sud)));
  const demiLongitude = demiLatitude / Math.cos((latitudeLaPlusLoin * Math.PI) / 180);
  return arrondirZoneALaGrille({ nord, sud, ouest: ouestCase - demiLongitude, est: ouestCase + pas + demiLongitude }, pas);
}
