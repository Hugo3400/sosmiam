import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ReactionChat } from "@sos-miam/commun/types/conversations";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";
import { nommerReactionChat } from "~/fonctions/chat/nommer-reaction-chat";

/** Une réaction et qui l'a mise, pour le lecteur d'écran : « Cœur, 2 réactions, dont toi », « Waouh, 1 réaction : la tienne ». */
export function decrireReactionChat(reaction: ReactionChat, nombre: number, dontMoi: boolean, langue: Langue): string {
  const T = choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue);
  const nom = nommerReactionChat(reaction, langue);
  if (nombre === 1 && dontMoi) return T.reactionLaTienne(nom);
  return T.reactions(nom, nombre, dontMoi);
}
