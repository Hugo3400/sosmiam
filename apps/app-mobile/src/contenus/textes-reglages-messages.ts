import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REGLAGES_MESSAGES_ANGLAIS } from "~/contenus/anglais/textes-reglages-messages";

export const TEXTES_REGLAGES_MESSAGES = {
  titre: "Messages",
  sousTitre: "Ce que tes potes voient de ta lecture, et ce que te disent tes notifications.",
  sansCompte: "Avec un compte, tu règles ici le « Vu » et l'aperçu de tes messages dans les notifications.",
  chargement: "Chargement de tes réglages",
  montrerLu: "Montrer que j'ai lu",
  montrerLuDetail: "Tes potes voient « Vu » sous leur message. Si tu le coupes, tu ne vois plus le leur non plus.",
  apercu: {
    titre: "Dans les notifications",
    entier: { titre: "Le message en entier", detail: "« Léa : On se fait une pizza ce soir ? »" },
    discret: { titre: "Juste qui t'écrit", detail: "« Léa t'a écrit », et la suite dans l'app" },
    chiffre: "Le message reste chiffré jusqu'à ton téléphone : ni Apple ni Google ne le lisent.",
  },
} as const;

export const TEXTES_REGLAGES_MESSAGES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REGLAGES_MESSAGES>> = { fr: TEXTES_REGLAGES_MESSAGES, en: TEXTES_REGLAGES_MESSAGES_ANGLAIS };
