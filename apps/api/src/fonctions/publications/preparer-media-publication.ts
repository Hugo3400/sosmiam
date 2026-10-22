import { nettoyerJpeg, type NettoyerJpeg } from "../../services/nettoyeur-jpeg.ts";
import { ajouterOrientationJpeg } from "../medias/ajouter-orientation-jpeg.ts";
import { lireOrientationJpeg } from "../medias/lire-orientation-jpeg.ts";
import { nettoyerVideoMp4 } from "../medias/nettoyer-video-mp4.ts";
import { retirerMetadonneesPng } from "../medias/retirer-metadonnees-png.ts";
import { verifierDonneesPng } from "../medias/verifier-donnees-png.ts";

export type MediaPublicationPrepare = { ok: true; octets: Buffer } | { ok: false; erreur: "format-refuse" | "nettoyage-impossible" };

const COTE_MAX = 32_768;
const PIXELS_MAX = 50_000_000;
const SIGNATURE_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const REFUS = { ok: false, erreur: "nettoyage-impossible" } as const;

const estPng = (o: Uint8Array) => o.length >= 8 && SIGNATURE_PNG.every((octet, k) => o[k] === octet);
const estJpeg = (o: Uint8Array) => o.length >= 4 && o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff;

export async function preparerMediaPublication(octets: Buffer, video: boolean, nettoyer: NettoyerJpeg = nettoyerJpeg): Promise<MediaPublicationPrepare> {
  if (video) {
    const propre = nettoyerVideoMp4(octets);
    return propre ? { ok: true, octets: propre } : REFUS;
  }
  if (estPng(octets)) {
    const png = retirerMetadonneesPng(octets);
    if (!png || png.largeur > COTE_MAX || png.hauteur > COTE_MAX || png.largeur * png.hauteur > PIXELS_MAX) return REFUS;
    return (await verifierDonneesPng(png.donnees, png.passes)) ? { ok: true, octets: png.octets } : REFUS;
  }
  if (estJpeg(octets)) {
    const propre = await nettoyer(octets);
    if (!propre) return REFUS;
    const orientation = lireOrientationJpeg(octets);
    return { ok: true, octets: orientation ? ajouterOrientationJpeg(propre, orientation) : propre };
  }
  return { ok: false, erreur: "format-refuse" };
}
