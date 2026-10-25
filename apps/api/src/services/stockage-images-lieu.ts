import { join } from "node:path";

import type { StockagesImagesLieu } from "./images-lieu-regles.ts";
import { creerStockagePhotosAvis, creerStockagePhotosAvisEnMemoire, type StockagePhotosAvisEnMemoire } from "./stockage-photos-avis.ts";

export const DOSSIER_IMAGES_LIEU = process.env.DOSSIER_IMAGES_LIEU || "/var/lib/sos-miam/images-lieux";

export const creerStockagesImagesLieu = (dossier = DOSSIER_IMAGES_LIEU): StockagesImagesLieu => ({
  banniere: creerStockagePhotosAvis(join(dossier, "bannieres")),
  logo: creerStockagePhotosAvis(join(dossier, "logos"), { extension: "png" }),
});

export function creerStockagesImagesLieuEnMemoire(o: { partLibre?: number; horloge?: () => number } = {}): { banniere: StockagePhotosAvisEnMemoire; logo: StockagePhotosAvisEnMemoire } {
  return { banniere: creerStockagePhotosAvisEnMemoire(o), logo: creerStockagePhotosAvisEnMemoire({ ...o, extension: "png" }) };
}
