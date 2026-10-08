import type { PositionLieu } from "../../types/lieu.ts";

const RAYON_TERRE_M = 6_371_000;
const enRadians = (degres: number) => (degres * Math.PI) / 180;

/** Distance à vol d'oiseau entre deux points, en mètres (formule de haversine, la même que l'app en kilomètres). */
export function calculerDistanceMetres(a: PositionLieu, b: PositionLieu): number {
  const dLat = enRadians(b.latitude - a.latitude);
  const dLon = enRadians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(enRadians(a.latitude)) * Math.cos(enRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE_M * Math.asin(Math.min(1, Math.sqrt(h)));
}
