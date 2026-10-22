export function bornerDecalageZoom(decalage: number, zoom: number, taille: number): number {
  const limite = Math.max(0, (taille * (zoom - 1)) / 2);
  return Math.min(limite, Math.max(-limite, decalage));
}
