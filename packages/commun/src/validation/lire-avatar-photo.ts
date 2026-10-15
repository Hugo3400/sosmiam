import { FORME_NOM_PHOTO_PROFIL, PREFIXE_AVATAR_PHOTO } from "../regles/photo-profil.ts";

export function lireAvatarPhoto(valeur: unknown): string | null {
  if (typeof valeur !== "string" || !valeur.startsWith(PREFIXE_AVATAR_PHOTO)) return null;
  const nom = valeur.slice(PREFIXE_AVATAR_PHOTO.length);
  return FORME_NOM_PHOTO_PROFIL.test(nom) ? nom : null;
}
