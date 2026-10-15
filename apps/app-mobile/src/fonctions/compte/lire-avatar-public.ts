import { AVATARS_MIAMIS, PREFIXE_AVATAR_MIAMI } from "@sos-miam/commun/regles/avatars-miamis";
import { PREFIXE_AVATAR_PHOTO } from "@sos-miam/commun/regles/photo-profil";
import type { AvatarPhoto } from "@sos-miam/commun/types/photo-profil";
import { lireAvatarMiami } from "@sos-miam/commun/validation/lire-avatar-miami";
import { lireAvatarPhoto } from "@sos-miam/commun/validation/lire-avatar-photo";
import type { Avatar } from "~/stockage/avatar-local";

/**
 * L'inverse d'ecrireAvatarPublic : l'avatar d'une valeur lue sur le serveur (un emoji, ou « miami:<id> »), ou null quand
 * ce téléphone ne peut pas le porter : rien, un Miami que cette version ne connaît pas, ou le Capitaine, réservé au compte
 * officiel. Les Miamis au choix ont tous leur image (IMAGES_MIAMIS couvre chaque id, son type y veille).
 */
export function lireAvatarPublic(valeur: string): Avatar | null {
  if (valeur.startsWith(PREFIXE_AVATAR_PHOTO)) return lireAvatarPhoto(valeur) ? { type: "photo", uri: null, partage: valeur as AvatarPhoto } : null;
  if (!valeur.startsWith(PREFIXE_AVATAR_MIAMI)) return valeur ? { type: "emoji", emoji: valeur } : null;
  const miami = lireAvatarMiami(valeur);
  const auChoix = miami && !miami.reserve ? AVATARS_MIAMIS.find((m) => m.id === miami.id) : undefined;
  return auChoix ? { type: "miami", id: auChoix.id } : null;
}
