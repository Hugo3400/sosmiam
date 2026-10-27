import { CHEMIN_IMAGES_ACTUS } from "../../../../../packages/commun/src/regles/actus.ts";

export function ecrireAdresseImageActus(nom: string): string {
  return `${CHEMIN_IMAGES_ACTUS}/${nom}`;
}
