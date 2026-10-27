import { DOSSIER_PHOTOS_ACTUS } from "./actus-regles.ts";
import { creerPhotosActus } from "./photos-actus.ts";
import { creerStockagePhotosAvis } from "./stockage-photos-avis.ts";

export function faireLeMenagePhotosActus(maintenant = new Date()): Promise<number> {
  return creerPhotosActus(creerStockagePhotosAvis(DOSSIER_PHOTOS_ACTUS)).menager(maintenant);
}
