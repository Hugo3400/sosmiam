import { formaterPrixLangue } from "../../../../../packages/commun/src/fonctions/langue/formater-prix-langue.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_PROS } from "~/contenus/pros";

export const TEXTES_PROS_ANGLAIS: Traduction<typeof TEXTES_PROS> = {
  badge: "🍽️ For venues",
  titre: { haut: "Is your dining room too quiet?", bas: "Send out an SOS." },
  avantages: [
    { fort: "Free listing", suite: "ready in 5 minutes." },
    { fort: "“Tables tonight” alert:", suite: "people in the neighbourhood get notified." },
    { fort: "Stats:", suite: "views, rescues, confirmed visits." },
    { fort: "Local creators:", suite: "ask for a video of your venue." },
    { fort: "Zero commission", suite: "on your bookings." },
  ],
  bouton: "List my venue",
  carte: {
    pourToujours: "Forever",
    titre: "It's all free",
    prix: formaterPrixLangue(0, "en"),
    pourTonLieu: "for your venue",
    outils: ["Venue listing", "Verified reviews", "Visit QR code", "Tonight's SOS", "Detailed stats", "Events"],
    sansEngagement: "No subscription, no commitment, no commission",
    pub: "SOS Miam is funded by ads – always labelled, and they never change the rankings.",
  },
};
