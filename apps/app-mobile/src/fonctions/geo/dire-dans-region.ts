/** Les régions qui ne se disent pas « en … » */
const EXCEPTIONS: Readonly<Record<string, string>> = {
  "Grand Est": "dans le Grand Est",
  "Hauts-de-France": "dans les Hauts-de-France",
  "Pays de la Loire": "dans les Pays de la Loire",
  "La Réunion": "à La Réunion",
  Mayotte: "à Mayotte",
};

/** « en Occitanie », « dans le Grand Est », « à La Réunion » : la bonne préposition devant le nom d'une région. */
export function direDansRegion(region: string): string {
  return EXCEPTIONS[region] ?? `en ${region}`;
}
