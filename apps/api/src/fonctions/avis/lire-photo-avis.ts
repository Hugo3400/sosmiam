/** Nom d'un fichier de photo envoyé avant l'avis : lettres, chiffres, tirets, et l'extension d'une image */
const FORME_PHOTO = /^[A-Za-z0-9_-]{1,100}\.(jpe?g|png|webp|heic)$/;

/** La photo d'un avis lue dans une demande : null si absente, undefined si elle ne va pas */
export function lirePhotoAvis(brut: unknown): string | null | undefined {
  if (brut === undefined || brut === null) return null;
  return typeof brut === "string" && FORME_PHOTO.test(brut) ? brut : undefined;
}
