/** Distance lisible : 0,35 → « 350 m », 0,98 → « 1 km » (jamais « 1000 m »), 1,1 → « 1,1 km », 33 → « 33 km ». */
export function formaterDistance(km: number): string {
  const metres = Math.round((km * 1000) / 50) * 50;
  if (metres < 1000) return `${Math.max(50, metres)} m`;
  if (km < 10) return `${km.toFixed(1).replace(".", ",").replace(",0", "")} km`;
  return `${Math.round(km)} km`;
}
