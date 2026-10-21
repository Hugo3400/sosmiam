import { IMAGES_SIGNALEMENT_MAX } from "../../../../../packages/commun/src/regles/securite.ts";
import type { ImageSignalementSecurite } from "../../../../../packages/commun/src/types/securite.ts";

export type LectureImagesSignalement = { ok: true; images: ImageSignalementSecurite[] } | { ok: false; erreur: "champ-invalide" | "trop-d-images" };

const lireImage = (valeur: unknown): ImageSignalementSecurite | null => {
  if (typeof valeur !== "object" || valeur === null || Array.isArray(valeur)) return null;
  const { nomFichier, base64 } = valeur as Record<string, unknown>;
  if (typeof nomFichier !== "string" || nomFichier.trim() === "" || nomFichier.length > 200) return null;
  if (typeof base64 !== "string" || base64 === "") return null;
  return { nomFichier: nomFichier.trim(), base64 };
};

export function lireImagesSignalement(valeur: unknown): LectureImagesSignalement {
  if (valeur === undefined || valeur === null) return { ok: true, images: [] };
  if (!Array.isArray(valeur)) return { ok: false, erreur: "champ-invalide" };
  if (valeur.length > IMAGES_SIGNALEMENT_MAX) return { ok: false, erreur: "trop-d-images" };
  const images: ImageSignalementSecurite[] = [];
  for (const element of valeur) {
    const image = lireImage(element);
    if (!image) return { ok: false, erreur: "champ-invalide" };
    images.push(image);
  }
  return { ok: true, images };
}
