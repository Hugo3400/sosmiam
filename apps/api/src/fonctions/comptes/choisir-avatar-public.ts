import { ecrireAvatarPhoto } from "../../../../../packages/commun/src/fonctions/compte/ecrire-avatar-photo.ts";

export type AvatarDuCompte = { avatar: string | null; photoProfil?: string | null; limitations?: readonly unknown[] };

export function choisirAvatarPublic(compte: AvatarDuCompte): string | null {
  const cachee = (compte.limitations?.length ?? 0) > 0;
  return compte.photoProfil && !cachee ? ecrireAvatarPhoto(compte.photoProfil) : compte.avatar;
}
