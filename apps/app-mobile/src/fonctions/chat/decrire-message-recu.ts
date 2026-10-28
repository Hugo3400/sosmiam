import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { MessageChat } from "@sos-miam/commun/types/conversations";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";
import { TEXTES_SONDAGE_PAR_LANGUE } from "~/contenus/textes-sondage";

/**
 * Ce que le lecteur d'écran dit quand un pote écrit : « Léa : On y va ? », « Léa a envoyé une photo »,
 * « Léa a envoyé une note vocale », « Léa a envoyé un lieu : Chez Nonna Lia », « Léa a envoyé un GIF », « Léa lance un sondage : On mange où ? ».
 */
export function decrireMessageRecu(message: MessageChat, prenom: string, langue: Langue, lieuNom?: string): string {
  const T = choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue);
  if (message.type === "photo") return T.recuPhoto(prenom);
  if (message.type === "vocal") return T.recuVocal(prenom);
  if (message.type === "lieu") return T.recuLieu(prenom, lieuNom);
  if (message.type === "gif") return T.recuGif(prenom);
  if (message.type === "vote") return T.recuSondage(prenom, choisirTextes(TEXTES_SONDAGE_PAR_LANGUE, langue).question);
  return T.avecAuteur(prenom, message.texte ?? "");
}
