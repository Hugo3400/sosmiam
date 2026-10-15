import { citationsPhotosAvis } from "./citations-photos-avis.ts";
import { creerPhotosAvis } from "./photos-avis.ts";
import { creerStockagePhotosAvis } from "./stockage-photos-avis.ts";

export function faireLeMenagePhotosAvis(maintenant = new Date()): Promise<number> {
  return creerPhotosAvis({ stockage: creerStockagePhotosAvis(), citations: citationsPhotosAvis }).menager(maintenant);
}
