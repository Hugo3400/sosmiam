import { FORME_ONDE_VOCAL } from "@sos-miam/commun/regles/chat";

export function lireOndeVocal(onde: string | undefined): number[] | null {
  if (!onde || !FORME_ONDE_VOCAL.test(onde)) return null;
  return Array.from(onde, (chiffre) => Number(chiffre));
}
