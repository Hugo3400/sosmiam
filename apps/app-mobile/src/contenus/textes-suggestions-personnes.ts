import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_SUGGESTIONS_PERSONNES_ANGLAIS } from "~/contenus/anglais/textes-suggestions-personnes";

export const TEXTES_SUGGESTIONS_PERSONNES = {
  raisons: {
    "te-suit": "Te suit",
    "ta-bande": "Ta bande",
    "potes-en-commun": "Dans la bande de tes potes",
  },
  teSuit: "Te suit",
};

export const TEXTES_SUGGESTIONS_PERSONNES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_SUGGESTIONS_PERSONNES>> = { fr: TEXTES_SUGGESTIONS_PERSONNES, en: TEXTES_SUGGESTIONS_PERSONNES_ANGLAIS };
