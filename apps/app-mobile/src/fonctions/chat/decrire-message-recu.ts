import { QUESTION_SONDAGE } from "@sos-miam/commun/regles/chat";
import type { MessageChat } from "@sos-miam/commun/types/conversations";

/**
 * Ce que le lecteur d'écran dit quand un pote écrit : « Léa : On y va ? », « Léa a envoyé une photo »,
 * « Léa a envoyé une note vocale », « Léa a envoyé un lieu : Chez Nonna Lia », « Léa a envoyé un GIF », « Léa lance un sondage : On mange où ? ».
 */
export function decrireMessageRecu(message: MessageChat, prenom: string, lieuNom?: string): string {
  if (message.type === "photo") return `${prenom} a envoyé une photo`;
  if (message.type === "vocal") return `${prenom} a envoyé une note vocale`;
  if (message.type === "lieu") return `${prenom} a envoyé un lieu${lieuNom ? ` : ${lieuNom}` : ""}`;
  if (message.type === "gif") return `${prenom} a envoyé un GIF`;
  if (message.type === "vote") return `${prenom} lance un sondage : ${message.texte ?? QUESTION_SONDAGE}`;
  return `${prenom} : ${message.texte ?? ""}`;
}
