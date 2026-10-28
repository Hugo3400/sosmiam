import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { CANAUX_ANDROID_ANGLAIS } from "~/contenus/anglais/canaux-android";

export const CANAUX_ANDROID = {
  miamSafe: {
    nom: "Miam Safe",
    description: "Quand quelqu'un a besoin d'aide : l'alerte du comptoir pour ton équipe, ou un pote qui te prévient.",
  },
  messages: {
    nom: "Messages et sorties",
    description: "Tes potes t'écrivent, t'invitent à une sortie ou rejoignent ta bande : ça sonne, ça vibre, tu ne rates rien.",
  },
  messagesDiscrets: {
    nom: "Messages à la suite",
    description: "Quand un pote enchaîne les messages : le premier sonne, la suite arrive sans bruit.",
  },
  notifications: {
    nom: "Nouvelles de SOS Miam",
    description: "Les SOS et bons plans près de chez toi, tes visites validées et des nouvelles du Capitaine Bouiboui.",
  },
};

export const CANAUX_ANDROID_PAR_LANGUE: ParLangue<Traduction<typeof CANAUX_ANDROID>> = { fr: CANAUX_ANDROID, en: CANAUX_ANDROID_ANGLAIS };
