import type { ReactionChat } from "@sos-miam/commun/types/conversations";
import { nommerReactionChat } from "~/fonctions/chat/nommer-reaction-chat";

/** Une réaction et qui l'a mise, pour le lecteur d'écran : « Cœur, 2 réactions, dont toi », « Waouh, 1 réaction : la tienne ». */
export function decrireReactionChat(reaction: ReactionChat, nombre: number, dontMoi: boolean): string {
  const nom = nommerReactionChat(reaction);
  if (nombre === 1 && dontMoi) return `${nom}, 1 réaction : la tienne`;
  return `${nom}, ${nombre} réaction${nombre > 1 ? "s" : ""}${dontMoi ? ", dont toi" : ""}`;
}
