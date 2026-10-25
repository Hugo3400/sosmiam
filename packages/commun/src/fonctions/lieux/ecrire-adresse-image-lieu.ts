import { CHEMIN_IMAGES_LIEU, FORME_NOM_IMAGE_LIEU } from "../../regles/images-lieu.ts";

export function ecrireAdresseImageLieu(nom: string | null | undefined): string | null {
  return typeof nom === "string" && FORME_NOM_IMAGE_LIEU.test(nom) ? `${CHEMIN_IMAGES_LIEU}/${nom}` : null;
}
