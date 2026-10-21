export function lireIdOffre(valeur: unknown): number | null {
  return typeof valeur === "string" && /^[1-9]\d{0,8}$/.test(valeur) ? Number(valeur) : null;
}
