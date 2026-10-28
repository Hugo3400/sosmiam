import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_REGLAGES_MESSAGES } from "~/contenus/textes-reglages-messages";

export const TEXTES_REGLAGES_MESSAGES_ANGLAIS: Traduction<typeof TEXTES_REGLAGES_MESSAGES> = {
  titre: "Messages",
  sousTitre: "What your friends see when you've read their messages, and what your notifications tell you.",
  sansCompte: "With an account, this is where you set the “Seen” and your message previews in notifications.",
  chargement: "Loading your settings",
  montrerLu: "Show that I've read",
  montrerLuDetail: "Your friends see “Seen” under their message. If you turn it off, you won't see theirs either.",
  apercu: {
    titre: "In notifications",
    entier: { titre: "The whole message", detail: "“Léa: Pizza tonight?”" },
    discret: { titre: "Just who's messaging you", detail: "“Léa sent you a message”, and the rest in the app" },
    chiffre: "The message stays encrypted all the way to your phone – neither Apple nor Google can read it.",
  },
};
