import { normaliserEtiquette } from "@sos-miam/commun/fonctions/etiquettes/normaliser-etiquette";

const JAMAIS_MONTREES = new Set(["Halal", "Casher", "Sans porc", "Sans gluten", "Sans lactose"].map(normaliserEtiquette));

export function listerEnviesEnCommun(miennes: readonly string[], siennes: readonly string[]): string[] {
  const cles = new Set(siennes.map(normaliserEtiquette));
  return miennes.filter((nom) => cles.has(normaliserEtiquette(nom)) && !JAMAIS_MONTREES.has(normaliserEtiquette(nom)));
}
