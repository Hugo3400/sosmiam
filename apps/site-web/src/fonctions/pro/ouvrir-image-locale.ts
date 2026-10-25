import { reconnaitreFormatImage } from "./reconnaitre-format-image.ts";

export const POIDS_MAX_IMAGE_SOURCE = 25 * 1024 * 1024;

const TAILLE_TETE = 12;

export type ImageOuverte = { ok: true; image: ImageBitmap } | { ok: false; erreur: "format" | "poids" | "illisible" };

async function decoder(fichier: Blob): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(fichier, { imageOrientation: "from-image" });
  } catch {
    return createImageBitmap(fichier).catch(() => null);
  }
}

export async function ouvrirImageLocale(fichier: Blob): Promise<ImageOuverte> {
  if (fichier.size > POIDS_MAX_IMAGE_SOURCE) return { ok: false, erreur: "poids" };
  const tete = new Uint8Array(await fichier.slice(0, TAILLE_TETE).arrayBuffer().catch(() => new ArrayBuffer(0)));
  if (!reconnaitreFormatImage(tete)) return { ok: false, erreur: "format" };
  const image = await decoder(fichier);
  if (!image || image.width === 0 || image.height === 0) {
    image?.close();
    return { ok: false, erreur: "illisible" };
  }
  return { ok: true, image };
}
