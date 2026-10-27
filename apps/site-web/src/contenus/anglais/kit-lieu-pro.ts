import { citer } from "../../../../../packages/commun/src/fonctions/langue/citer.ts";
import { PHRASE_MIAM_SAFE } from "../../../../../packages/commun/src/regles/miam-safe.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_KIT_LIEU_PRO } from "~/contenus/kit-lieu-pro";

export const TEXTES_KIT_LIEU_PRO_ANGLAIS: Traduction<typeof TEXTES_KIT_LIEU_PRO> = {
  meta: {
    titre: (nom: string) => `Media kit · ${nom}`,
    titreParDefaut: "Media kit",
    description: "Your venue's media kit on SOS Miam.",
  },
  page: "Media kit",
  chapo: "Everything you need to say your venue is on SOS Miam: visuals for your socials, stickers for your shop window, ready-to-post texts. It's all free.",
  toutLeKit: "The whole kit in one go: the visuals, stickers, logos, texts and rules, in a single file.",
  toutTelecharger: (poids: string | null) => `Download everything${poids ? ` (ZIP, ${poids})` : " (ZIP)"}`,
  voirCharte: "See the Miam Safe charter",
  cartes: {
    onEstSur: { titre: "“On est sur SOS Miam” (We're on SOS Miam)", texte: "The foodie mascot on a yellow background, to tell your customers they'll find you on SOS Miam." },
    miamSafe: { titre: "“Ici, on est Miam Safe” (We've signed the Miam Safe charter)", texte: "To say your staff have signed the charter, with the phrase to say at the counter." },
    autocollantSosMiam: { titre: "“On est sur SOS Miam” sticker", texte: "A yellow 10 cm circle for your shop window or till." },
    autocollantMiamSafe: { titre: "“Lieu Miam Safe” sticker", texte: `A black 10 cm circle, with the phrase ${citer(PHRASE_MIAM_SAFE, "en")}.` },
    memo: { titre: "Miam Safe staff memo", texte: "The phrase, the screen to recognise and the four steps, in A5, for behind the counter." },
    logoClair: { titre: "Logo for light backgrounds", texte: "For your website, menus or socials, on a light background." },
    logoSombre: { titre: "Logo for dark backgrounds", texte: "The same, with “SOS” in cream, for a dark background." },
  },
  aTonNom: {
    titre: "In your venue's name, ready to print",
    texte: "With your venue's name and a QR code to your listing: print the page as it is, or save it as a PDF for the print shop.",
    pages: {
      vitrine: { titre: "The window poster", texte: "In A4, A3 or 40 × 60 cm, with the Miam Safe badge if you've signed the charter." },
      chevalet: { titre: "The table tent", texte: "Two A6 sides to fold, so it stands up on the table." },
      affichette: { titre: "The table card", texte: "A single A6 side, to put on the counter." },
    },
    ouvrir: "Open and print",
  },
  textes: {
    titre: "Ready-to-post texts",
    texte: "Copy, adapt in your own words, and post with a visual. The link leads to your venue's listing on sosmiam.fr.",
  },
  regles: {
    titre: "The kit rules",
    texte: "A few rules to keep things fair, for your customers and for other venues.",
  },
  avantTitre: ": ",
  fichiers: {
    pdf: "Download the PDF to print",
    story: "Download the story PNG",
    post: "Download the post PNG",
    png: "Download the PNG",
  },
};
