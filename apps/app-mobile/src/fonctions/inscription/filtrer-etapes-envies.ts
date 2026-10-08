import { AGE_ALCOOL } from "@sos-miam/commun/regles/ages";

import type { EtapeEnvies } from "~/contenus/inscription/envies";

/** Sous 18 ans (ou âge inconnu, par prudence), retire les étapes et les choix liés à l'alcool. */
export function filtrerEtapesEnvies(etapes: EtapeEnvies[], age: number | null): EtapeEnvies[] {
  if (age !== null && age >= AGE_ALCOOL) return etapes;
  return etapes.filter((etape) => !etape.alcool).map((etape) => ({ ...etape, choix: etape.choix.filter((choix) => !choix.alcool) }));
}
