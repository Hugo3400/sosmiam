import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ReactionChat } from "@sos-miam/commun/types/conversations";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";

// Les emoji ne sont pas lus tels quels : VoiceOver dirait « visage qui pleure de rire » ou « visage qui se lèche les babines »
/** Le nom d'une réaction du chat, pour le lecteur d'écran : « ❤️ » → « Cœur », « 😋 » → « Miam ». */
export function nommerReactionChat(reaction: ReactionChat, langue: Langue): string {
  return choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue).nomsReactions[reaction];
}
