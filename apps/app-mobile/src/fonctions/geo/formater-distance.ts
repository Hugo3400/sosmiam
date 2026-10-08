/** Distance lisible : 0,35 → « 350 m », 1,1 → « 1,1 km », 33 → « 33 km ». */
export function formaterDistance(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `${km.toFixed(1).replace(".", ",").replace(",0", "")} km`;
  return `${Math.round(km)} km`;
}
