import { COTE_MIN_PHOTO_AVIS } from "@sos-miam/commun/regles/avis";

import type { PhotoAvis } from "~/contenus/type-donner-avis";

export function estPhotoAvisTropPetite(photo: Pick<PhotoAvis, "largeur" | "hauteur">): boolean {
  return Math.min(photo.largeur, photo.hauteur) < COTE_MIN_PHOTO_AVIS;
}
