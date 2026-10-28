import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { CANAUX_ANDROID } from "~/contenus/canaux-android";

export const CANAUX_ANDROID_ANGLAIS: Traduction<typeof CANAUX_ANDROID> = {
  miamSafe: {
    nom: "Miam Safe",
    description: "When someone needs help: the counter alert for your staff, or a friend letting you know.",
  },
  messages: {
    nom: "Messages and get-togethers",
    description: "Your friends message you, invite you to a get-together or join your crew: it rings, it buzzes, you won't miss a thing.",
  },
  messagesDiscrets: {
    nom: "Follow-up messages",
    description: "When a friend sends message after message: the first one rings, the rest arrive quietly.",
  },
  notifications: {
    nom: "News from SOS Miam",
    description: "SOSs and good deals near you, your confirmed visits and news from Capitaine Bouiboui.",
  },
};
