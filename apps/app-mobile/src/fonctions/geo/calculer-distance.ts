import type { PositionLieu } from "@sos-miam/commun/types/lieu";

const RAYON_TERRE_KM = 6371;
const enRadians = (degres: number) => (degres * Math.PI) / 180;

/** Distance à vol d'oiseau entre deux points, en kilomètres (formule de haversine). */
export function calculerDistance(a: PositionLieu, b: PositionLieu): number {
  const dLat = enRadians(b.latitude - a.latitude);
  const dLon = enRadians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(enRadians(a.latitude)) * Math.cos(enRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
