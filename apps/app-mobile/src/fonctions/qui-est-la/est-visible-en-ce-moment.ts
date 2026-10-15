export function estVisibleEnCeMoment(visible: boolean, jusqua: string | null, maintenantMs: number): boolean {
  if (!visible || !jusqua) return false;
  const fin = Date.parse(jusqua);
  return !Number.isNaN(fin) && fin > maintenantMs;
}
