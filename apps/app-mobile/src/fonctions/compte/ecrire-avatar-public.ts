import { PREFIXE_AVATAR_MIAMI } from "@sos-miam/commun/regles/avatars-miamis";
import type { Avatar } from "~/stockage/avatar-local";

/** Ton avatar tel que les autres le voient : l'emoji, ou « miami:<id> » ; null pour une photo. */
export function ecrireAvatarPublic(avatar: Avatar): string | null {
  if (avatar.type === "emoji") return avatar.emoji;
  if (avatar.type === "miami") return `${PREFIXE_AVATAR_MIAMI}${avatar.id}`;
  return null;
}
