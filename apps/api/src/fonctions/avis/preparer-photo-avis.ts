import { COTE_MIN_PHOTO_AVIS } from "../../../../../packages/commun/src/regles/avis.ts";
import { nettoyerJpeg, type NettoyerJpeg } from "../../services/nettoyeur-jpeg.ts";
import { COTE_MAX_PHOTO_AVIS, TAILLE_MAX_PHOTO_AVIS, type RefusPhotoAvis } from "../../services/photos-avis-regles.ts";
import { lireTailleJpeg } from "../medias/lire-taille-jpeg.ts";

export type PhotoAvisPreparee = { ok: true; octets: Buffer; largeur: number; hauteur: number };

const commenceCommeUnJpeg = (o: Uint8Array) => o.length >= 4 && o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff;

export async function preparerPhotoAvis(octets: Uint8Array, nettoyer: NettoyerJpeg = nettoyerJpeg): Promise<PhotoAvisPreparee | RefusPhotoAvis> {
  if (!commenceCommeUnJpeg(octets)) return { ok: false, erreur: "format-refuse" };
  if (octets.length > TAILLE_MAX_PHOTO_AVIS) return { ok: false, erreur: "media-trop-lourd" };
  const taille = lireTailleJpeg(octets);
  if (!taille) return { ok: false, erreur: "media-invalide", champ: "format" };
  if (Math.max(taille.largeur, taille.hauteur) > COTE_MAX_PHOTO_AVIS || Math.min(taille.largeur, taille.hauteur) < COTE_MIN_PHOTO_AVIS) {
    return { ok: false, erreur: "media-invalide", champ: "dimensions" };
  }
  const propre = await nettoyer(octets);
  if (!propre) return { ok: false, erreur: "media-invalide", champ: "format" };
  return { ok: true, octets: propre, largeur: taille.largeur, hauteur: taille.hauteur };
}
