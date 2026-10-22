export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;

export function calculerZoomPincement(zoomDepart: number, distanceDepart: number, distance: number): number {
  if (!(distanceDepart > 0) || !(distance > 0)) return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomDepart));
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomDepart * (distance / distanceDepart)));
}
