import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { AVATARS_EMOJI_PAR_LANGUE } from "~/contenus/avatars-emoji";
import { NOMS_AVATARS_MIAMIS_PAR_LANGUE } from "~/contenus/noms-avatars-miamis";
import { TEXTES_REGLAGES_AVATAR_PAR_LANGUE } from "~/contenus/textes-reglages-avatar";
import type { Avatar } from "~/stockage/avatar-local";

/** Le nom d'un avatar, lu par le lecteur d'écran et écrit dans les réglages : « Miami Toque », « renard » (l'emoji lui-même s'il n'est pas dans la liste), « ta photo ». */
export function nommerAvatar(avatar: Avatar, langue: Langue): string {
  const T = choisirTextes(TEXTES_REGLAGES_AVATAR_PAR_LANGUE, langue).nommer;
  if (avatar.type === "photo") return T.photo;
  if (avatar.type === "miami") return choisirTextes(NOMS_AVATARS_MIAMIS_PAR_LANGUE, langue)[avatar.id] ?? T.miamiInconnu(avatar.id);
  const nom = choisirTextes(AVATARS_EMOJI_PAR_LANGUE, langue).find((a) => a.emoji === avatar.emoji)?.nom;
  return nom ? T.emoji(nom) : avatar.emoji;
}
