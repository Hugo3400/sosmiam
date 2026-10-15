import { CHEMIN_PHOTOS_PROFIL } from "../../regles/photo-profil.ts";
import { lireAvatarPhoto } from "../../validation/lire-avatar-photo.ts";

export function construireAdressePhotoProfil(avatar: unknown, adresseMedias: string): string | null {
  const nom = lireAvatarPhoto(avatar);
  const base = adresseMedias.trim().replace(/\/+$/, "");
  if (nom === null || base === "") return null;
  return `${base}/${CHEMIN_PHOTOS_PROFIL}/${nom}`;
}
