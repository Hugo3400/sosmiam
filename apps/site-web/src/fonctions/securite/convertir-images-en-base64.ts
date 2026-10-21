import { IMAGE_SIGNALEMENT_OCTETS_MAX, IMAGES_SIGNALEMENT_MAX } from "../../../../../packages/commun/src/regles/securite.ts";
import type { ErreurSecurite } from "../../../../../packages/commun/src/types/erreurs-securite.ts";
import type { ImageSignalementSecurite } from "../../../../../packages/commun/src/types/securite.ts";

export type ImagesConverties = { ok: true; images: ImageSignalementSecurite[] } | { ok: false; erreur: ErreurSecurite };

const SIGNATURE_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const SIGNATURE_JPEG = [0xff, 0xd8, 0xff];

function commencePar(octets: Uint8Array, signature: number[]): boolean {
  return signature.every((octet, rang) => octets[rang] === octet);
}

function nommerImage(nom: string, extension: "png" | "jpg", rang: number): string {
  const base = (nom.split(/[\\/]/).pop() ?? "").replace(/[\u0000-\u001f\u007f"<>|*?:]/g, "").replace(/\s+/g, " ").trim();
  const sansExtension = base.replace(/\.(png|jpe?g)$/i, "").slice(0, 90).trim();
  return `${sansExtension || `capture-${rang + 1}`}.${extension}`;
}

export async function convertirImagesEnBase64(fichiers: File[]): Promise<ImagesConverties> {
  if (fichiers.length > IMAGES_SIGNALEMENT_MAX) return { ok: false, erreur: "trop-d-images" };
  if (fichiers.some((fichier) => fichier.size > IMAGE_SIGNALEMENT_OCTETS_MAX)) return { ok: false, erreur: "image-trop-lourde" };
  const images: ImageSignalementSecurite[] = [];
  for (const [rang, fichier] of fichiers.entries()) {
    const octets = new Uint8Array(await fichier.arrayBuffer());
    if (octets.length === 0 || octets.length > IMAGE_SIGNALEMENT_OCTETS_MAX) return { ok: false, erreur: octets.length === 0 ? "image-format" : "image-trop-lourde" };
    const extension = commencePar(octets, SIGNATURE_PNG) ? "png" : commencePar(octets, SIGNATURE_JPEG) ? "jpg" : null;
    if (!extension) return { ok: false, erreur: "image-format" };
    images.push({ nomFichier: nommerImage(fichier.name, extension, rang), base64: Buffer.from(octets).toString("base64") });
  }
  return { ok: true, images };
}
