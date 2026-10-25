import { REGLES_IMAGES_LIEU, type ImageLieu } from "../../../../../packages/commun/src/regles/images-lieu.ts";
import { nettoyerJpeg, type NettoyerJpeg } from "../../services/nettoyeur-jpeg.ts";
import { lireTailleJpeg } from "../medias/lire-taille-jpeg.ts";
import { retirerMetadonneesPng } from "../medias/retirer-metadonnees-png.ts";
import { verifierDonneesPng } from "../medias/verifier-donnees-png.ts";

export type ImageLieuPreparee = { ok: true; octets: Buffer };
export type RefusPreparationImageLieu = { ok: false; erreur: "image-lieu-invalide" | "image-lieu-trop-lourde" };

const INVALIDE: RefusPreparationImageLieu = { ok: false, erreur: "image-lieu-invalide" };

const estJpeg = (o: Uint8Array) => o.length >= 4 && o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff;

export async function preparerImageLieu(quelle: ImageLieu, octets: Uint8Array, nettoyer: NettoyerJpeg = nettoyerJpeg): Promise<ImageLieuPreparee | RefusPreparationImageLieu> {
  const regle = REGLES_IMAGES_LIEU[quelle];
  if (octets.length === 0) return INVALIDE;
  if (octets.length > regle.poidsMax) return { ok: false, erreur: "image-lieu-trop-lourde" };
  if (quelle === "logo") {
    const png = retirerMetadonneesPng(octets);
    if (!png || png.largeur !== regle.largeur || png.hauteur !== regle.hauteur) return INVALIDE;
    return (await verifierDonneesPng(png.donnees, png.passes)) ? { ok: true, octets: png.octets } : INVALIDE;
  }
  if (!estJpeg(octets)) return INVALIDE;
  const taille = lireTailleJpeg(octets);
  if (!taille || taille.largeur !== regle.largeur || taille.hauteur !== regle.hauteur) return INVALIDE;
  const propre = await nettoyer(octets);
  return propre ? { ok: true, octets: propre } : INVALIDE;
}
