import { POINTS_AMBASSADEUR } from "../../../../../packages/commun/src/regles/ambassadeurs.ts";
import { RESCOUSSES_PAR_SEMAINE } from "../../../../../packages/commun/src/regles/rescousses.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_COMMENT_CA_MARCHE } from "~/contenus/comment-ca-marche";

export const TEXTES_COMMENT_CA_MARCHE_ANGLAIS: Traduction<typeof TEXTES_COMMENT_CA_MARCHE> = {
  surtitre: "How it works",
  titre: "Four simple moves, and a little place in your neighbourhood has a better month.",
  mascotte: "Capitaine Bouiboui announcing a table tonight",
  etapes: [
    {
      titre: "Find your gem",
      texte: "Scroll through the restaurants, patisseries and bars near you. Places with an SOS tonight come first.",
      gain: "Area, budget or mood",
    },
    {
      titre: "Go for it when it rings",
      texte: "A place has free tables tonight? It sends out an SOS and the Captain sounds the alarm – your move.",
      gain: `+${POINTS_AMBASSADEUR.visiteSos} points during an SOS`,
    },
    {
      titre: "Get your visit confirmed",
      texte: "Ask for the bill in the app, or scan the counter QR code: your visit is confirmed, and your review really counts.",
      gain: `+${POINTS_AMBASSADEUR.visite} points and a stamp`,
    },
    {
      titre: "Come to the rescue",
      texte: `You get ${RESCOUSSES_PAR_SEMAINE} rescues a week, and they top up on Monday. Give them to the places that deserve them – it's your helping hand.`,
      gain: `+${POINTS_AMBASSADEUR.rescousse} points per rescue`,
    },
  ],
  verifies: {
    debut: "Points, stamps and rescues work in ",
    badge: "Verified ✓",
    fin: " places, the ones that run their own page on SOS Miam.",
  },
  bouton: "Tell me when it's out",
};
