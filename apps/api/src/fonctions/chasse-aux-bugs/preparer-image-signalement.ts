import { IMAGE_SIGNALEMENT_OCTETS_MAX } from "../../../../../packages/commun/src/regles/securite.ts";
import type { ImageSignalementSecurite } from "../../../../../packages/commun/src/types/securite.ts";
import type { NettoyerJpeg } from "../../services/nettoyeur-jpeg.ts";
import { lireTailleJpeg } from "../medias/lire-taille-jpeg.ts";
import { retirerMetadonneesPng } from "../medias/retirer-metadonnees-png.ts";
import { verifierDonneesPng } from "../medias/verifier-donnees-png.ts";
import { decoderImageSignalement } from "./decoder-image-signalement.ts";

export type ImageSignalementPreparee = { ok: true; octets: Buffer } | { ok: false; erreur: "image-trop-lourde" | "image-format" };

const COTE_MAX = 32_768;
const PIXELS_MAX = 50_000_000;
const SIGNATURE_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const estPng = (o: Uint8Array) => o.length >= 8 && SIGNATURE_PNG.every((octet, k) => o[k] === octet);
const estJpeg = (o: Uint8Array) => o.length >= 4 && o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff;
const estTropGrande = (largeur: number, hauteur: number) => largeur > COTE_MAX || hauteur > COTE_MAX || largeur * hauteur > PIXELS_MAX;

export async function preparerImageSignalement(image: ImageSignalementSecurite, nettoyerJpeg: NettoyerJpeg): Promise<ImageSignalementPreparee> {
  const decodee = decoderImageSignalement(image.base64, IMAGE_SIGNALEMENT_OCTETS_MAX);
  if (!decodee.ok) return decodee;
  const octets = decodee.octets;
  if (estPng(octets)) {
    const png = retirerMetadonneesPng(octets);
    if (!png) return { ok: false, erreur: "image-format" };
    if (estTropGrande(png.largeur, png.hauteur)) return { ok: false, erreur: "image-trop-lourde" };
    if (!(await verifierDonneesPng(png.donnees, png.passes))) return { ok: false, erreur: "image-format" };
    return { ok: true, octets: png.octets };
  }
  if (estJpeg(octets)) {
    const taille = lireTailleJpeg(octets);
    if (!taille) return { ok: false, erreur: "image-format" };
    if (estTropGrande(taille.largeur, taille.hauteur)) return { ok: false, erreur: "image-trop-lourde" };
    const propre = await nettoyerJpeg(octets);
    return propre ? { ok: true, octets: propre } : { ok: false, erreur: "image-format" };
  }
  return { ok: false, erreur: "image-format" };
}
