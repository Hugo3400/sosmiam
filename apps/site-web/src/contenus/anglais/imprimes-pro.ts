import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_IMPRIMES_PRO } from "~/contenus/imprimes-pro";

export const TEXTES_IMPRIMES_PRO_ANGLAIS: Traduction<typeof TEXTES_IMPRIMES_PRO> = {
  qr: "The QR code leads to your public listing, so there's nothing to update, even if your opening hours change.",
  nonPubliee: "Your listing isn't published yet: the QR code will work as soon as it is.",
  enFrancais: "It's printed in French, for your customers in France.",
  affichette: {
    meta: {
      titre: (nom: string) => `Table card · ${nom}`,
      titreParDefaut: "Table card",
      description: "Your venue's table card.",
    },
    page: "My table card",
    chapo: "To put on the tables or the counter: one scan, and your customers find your listing.",
    conseils: [
      "A6 size (105 × 148 mm): the size of a postcard.",
      "On an A4 sheet, tick “Actual size” (or 100%) and cut it out.",
    ],
  },
  vitrine: {
    meta: {
      titre: (nom: string) => `Window poster · ${nom}`,
      titreParDefaut: "Window poster",
      description: "Your venue's window poster.",
    },
    page: "My window poster",
    chapo: "For your shop window or dining room: your name in big letters, and a QR code to your listing.",
    format: "Size",
    conseils: {
      a4: "On an office printer, at “Actual size” (or 100%).",
      a3: "At a print shop, or on an A3 printer: save the page as a PDF first.",
      "40x60": "At a print shop: save the page as a PDF (“Save as PDF”) and take it with you.",
    },
    miamSafeSignee: "Your Miam Safe charter is signed, so the “Lieu Miam Safe” badge is at the bottom.",
    miamSafeNonSignee: "Sign the Miam Safe charter to add the “Lieu Miam Safe” badge.",
    imprimer: "Print the poster",
  },
  chevalet: {
    meta: {
      titre: (nom: string) => `Table tent · ${nom}`,
      titreParDefaut: "Table tent",
      description: "Your venue's table tent.",
    },
    page: "My table tent",
    chapo: "Two sides to fold, so it stands up on the table: one scan, and your customers find your listing.",
    conseils: [
      "On an A4 sheet, at “Actual size” (or 100%): cut out the 210 × 148 mm rectangle.",
      "Fold along the dotted line, printed sides facing out: thick paper (250 gsm) stands up better.",
    ],
    imprimer: "Print the table tent",
  },
  imprimer: {
    affichette: "Print the table card",
    sansJavascript: "To print it: use your browser's “Print” menu (Ctrl + P, or ⌘ + P on a Mac).",
  },
};
