import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import type { LecturePosition } from "@sos-miam/commun/types/position";

/** Mètres par degré de latitude, avec le même rayon de la Terre (6 371 km) que le calcul des distances */
const METRES_PAR_DEGRE_LATITUDE = (2 * Math.PI * 6_371_000) / 360;
const DECALAGE_NORD_M = 30;

/**
 * Position de démo (« Vérifier ma vraie position » coupé) : le téléphone fait comme s'il était à 30 m au nord du lieu,
 * à 15 m près, lu il y a une demi-seconde, sans app de simulation.
 */
export function creerPositionDemo(cible: PositionLieu): LecturePosition {
  return {
    latitude: cible.latitude + DECALAGE_NORD_M / METRES_PAR_DEGRE_LATITUDE,
    longitude: cible.longitude,
    precision: 15,
    ageMs: 500,
    simulee: false,
  };
}
