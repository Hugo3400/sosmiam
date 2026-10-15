import { AVATARS_MIAMIS } from "@sos-miam/commun/regles/avatars-miamis";
import { avatarsEmoji } from "~/contenus/avatars-emoji";
import type { Avatar } from "~/stockage/avatar-local";

/** Le nom d'un avatar, lu par le lecteur d'écran et écrit dans les réglages : « Miami Toque », « renard » (l'emoji lui-même s'il n'est pas dans la liste), « ta photo ». */
export function nommerAvatar(avatar: Avatar): string {
  if (avatar.type === "photo") return "ta photo";
  if (avatar.type === "miami") return `Miami ${AVATARS_MIAMIS.find((m) => m.id === avatar.id)?.nom ?? avatar.id}`;
  return avatarsEmoji.find((a) => a.emoji === avatar.emoji)?.nom ?? avatar.emoji;
}
