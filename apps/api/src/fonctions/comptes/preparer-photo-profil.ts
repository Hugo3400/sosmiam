import { COTE_PHOTO_PROFIL, TAILLE_MAX_PHOTO_PROFIL } from "../../../../../packages/commun/src/regles/photo-profil.ts";
import { nettoyerJpeg, type NettoyerJpeg } from "../../services/nettoyeur-jpeg.ts";
import type { RefusPhotoProfil } from "../../services/photos-profil-regles.ts";
import { lireTailleJpeg } from "../medias/lire-taille-jpeg.ts";

export type PhotoProfilPreparee = { ok: true; octets: Buffer };

const commenceCommeUnJpeg = (o: Uint8Array) => o.length >= 4 && o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff;

export async function preparerPhotoProfil(octets: Uint8Array, nettoyer: NettoyerJpeg = nettoyerJpeg): Promise<PhotoProfilPreparee | RefusPhotoProfil> {
  if (!commenceCommeUnJpeg(octets)) return { ok: false, erreur: "format-refuse" };
  if (octets.length > TAILLE_MAX_PHOTO_PROFIL) return { ok: false, erreur: "media-trop-lourd" };
  const taille = lireTailleJpeg(octets);
  if (!taille) return { ok: false, erreur: "media-invalide", champ: "format" };
  if (taille.largeur !== COTE_PHOTO_PROFIL || taille.hauteur !== COTE_PHOTO_PROFIL) return { ok: false, erreur: "media-invalide", champ: "dimensions" };
  const propre = await nettoyer(octets);
  if (!propre) return { ok: false, erreur: "media-invalide", champ: "format" };
  return { ok: true, octets: propre };
}
