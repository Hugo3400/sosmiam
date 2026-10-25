import { REGLES_IMAGES_LIEU, type ImageLieu } from "../../../../../packages/commun/src/regles/images-lieu.ts";
import type { Cadre } from "../../types/images-lieu.ts";
import { compresserSousLimite, type ImageCompressee } from "./compresser-sous-limite.ts";
import { dessinerRecadrage } from "./dessiner-recadrage.ts";

const QUALITE_SANS_PERTE = [1] as const;

export function exporterImageLieu(source: CanvasImageSource, cadre: Cadre, quelle: ImageLieu): Promise<ImageCompressee> {
  const regle = REGLES_IMAGES_LIEU[quelle];
  const toile = document.createElement("canvas");
  toile.width = regle.largeur;
  toile.height = regle.hauteur;
  const opaque = regle.type === "image/jpeg";
  dessinerRecadrage(toile, source, cadre, opaque);
  const encoder = (qualite: number) => new Promise<Blob | null>((rendre) => toile.toBlob(rendre, regle.type, qualite));
  return compresserSousLimite(encoder, regle.poidsMax, opaque ? undefined : QUALITE_SANS_PERTE);
}
