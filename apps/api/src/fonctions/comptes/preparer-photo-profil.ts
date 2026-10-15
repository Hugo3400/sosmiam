import { COTE_PHOTO_PROFIL, TAILLE_MAX_PHOTO_PROFIL } from "../../../../../packages/commun/src/regles/photo-profil.ts";
import type { RefusPhotoProfil } from "../../services/photos-profil-regles.ts";
import { lireTailleJpeg } from "../medias/lire-taille-jpeg.ts";
import { retirerMetadonneesJpeg } from "../medias/retirer-metadonnees-jpeg.ts";

export type PhotoProfilPreparee = { ok: true; octets: Buffer };

const commenceCommeUnJpeg = (o: Uint8Array) => o.length >= 4 && o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff;

export function preparerPhotoProfil(octets: Uint8Array): PhotoProfilPreparee | RefusPhotoProfil {
  if (!commenceCommeUnJpeg(octets)) return { ok: false, erreur: "format-refuse" };
  if (octets.length > TAILLE_MAX_PHOTO_PROFIL) return { ok: false, erreur: "media-trop-lourd" };
  const taille = lireTailleJpeg(octets);
  if (!taille) return { ok: false, erreur: "media-invalide", champ: "format" };
  if (taille.largeur !== COTE_PHOTO_PROFIL || taille.hauteur !== COTE_PHOTO_PROFIL) return { ok: false, erreur: "media-invalide", champ: "dimensions" };
  const propre = retirerMetadonneesJpeg(octets);
  if (!propre) return { ok: false, erreur: "media-invalide", champ: "format" };
  return { ok: true, octets: propre };
}
