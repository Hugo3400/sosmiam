import type { Position } from "~/fonctions/carte-des-lieux/arrondir-position";

export function creerLienItinerairePosition({ latitude, longitude }: Position): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
