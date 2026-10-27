import { PREFIXE_AVATAR_PHOTO } from "../../../../../packages/commun/src/regles/photo-profil.ts";

export function lireAvatarAuteurActus(avatar: string | null): string | null {
  return avatar && !avatar.startsWith(PREFIXE_AVATAR_PHOTO) ? avatar : null;
}
