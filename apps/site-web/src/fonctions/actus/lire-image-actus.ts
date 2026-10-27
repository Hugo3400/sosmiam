import { CHEMIN_IMAGES_ACTUS } from "../../../../../packages/commun/src/regles/actus.ts";

const NOM_IMAGE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i;

export function lireImageActus(adresse: unknown): string | null {
  if (typeof adresse !== "string" || !adresse.startsWith(`${CHEMIN_IMAGES_ACTUS}/`)) return null;
  return NOM_IMAGE.test(adresse.slice(CHEMIN_IMAGES_ACTUS.length + 1)) ? adresse : null;
}
