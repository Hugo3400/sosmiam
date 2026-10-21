export function lireListeTextes(valeur: unknown): string[] {
  return Array.isArray(valeur) ? valeur.filter((element): element is string => typeof element === "string") : [];
}
