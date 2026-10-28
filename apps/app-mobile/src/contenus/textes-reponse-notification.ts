import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { T_REPONSE_NOTIFICATION_ANGLAIS } from "~/contenus/anglais/textes-reponse-notification";

export const T_REPONSE_NOTIFICATION = {
  bouton: "Répondre",
  envoyer: "Envoyer",
  champ: "Ta réponse…",
  rateTitre: "😕 Ta réponse n'est pas partie",
  rateTexte: "Touche ici pour la renvoyer depuis la discussion.",
};

export const T_REPONSE_NOTIFICATION_PAR_LANGUE: ParLangue<Traduction<typeof T_REPONSE_NOTIFICATION>> = { fr: T_REPONSE_NOTIFICATION, en: T_REPONSE_NOTIFICATION_ANGLAIS };
