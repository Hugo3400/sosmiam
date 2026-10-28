import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { T_REPONSE_NOTIFICATION } from "~/contenus/textes-reponse-notification";

export const T_REPONSE_NOTIFICATION_ANGLAIS: Traduction<typeof T_REPONSE_NOTIFICATION> = {
  bouton: "Reply",
  envoyer: "Send",
  champ: "Your reply…",
  rateTitre: "😕 Your reply didn't go through",
  rateTexte: "Tap here to send it again from the conversation.",
};
