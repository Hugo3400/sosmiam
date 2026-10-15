import { PREFIXE_AVATAR_PHOTO } from "../../regles/photo-profil.ts";
import type { AvatarPhoto } from "../../types/photo-profil.ts";

export function ecrireAvatarPhoto(nom: string): AvatarPhoto {
  return `${PREFIXE_AVATAR_PHOTO}${nom}` as AvatarPhoto;
}
