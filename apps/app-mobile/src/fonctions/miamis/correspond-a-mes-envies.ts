import { normaliserEtiquette } from "@sos-miam/commun/fonctions/etiquettes/normaliser-etiquette";
import type { SortieMiamis } from "@sos-miam/commun/types/sorties-miamis";

export function correspondAMesEnvies(sortie: SortieMiamis, envies: readonly string[]): boolean {
  const cles = new Set(envies.map(normaliserEtiquette));
  return sortie.etiquettes.some((e) => cles.has(normaliserEtiquette(e.nom)));
}
