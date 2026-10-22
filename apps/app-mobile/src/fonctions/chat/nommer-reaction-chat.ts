import type { ReactionChat } from "@sos-miam/commun/types/conversations";

// Les emoji ne sont pas lus tels quels : VoiceOver dirait « visage qui pleure de rire » ou « visage qui se lèche les babines »
const NOMS: Record<ReactionChat, string> = {
  "❤️": "Cœur",
  "😂": "Mort de rire",
  "😋": "Miam",
  "👍": "Pouce levé",
  "😮": "Waouh",
};

/** Le nom d'une réaction du chat, pour le lecteur d'écran : « ❤️ » → « Cœur », « 😋 » → « Miam ». */
export function nommerReactionChat(reaction: ReactionChat): string {
  return NOMS[reaction];
}
