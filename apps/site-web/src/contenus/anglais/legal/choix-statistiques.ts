import type { Traduction } from "../../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_CHOIX_STATISTIQUES } from "~/contenus/legal/choix-statistiques";

export const TEXTES_CHOIX_STATISTIQUES_ANGLAIS: Traduction<typeof TEXTES_CHOIX_STATISTIQUES> = {
  comptees: "Your visits are counted",
  nonComptees: "Your visits aren't counted",
  signalNavigateur:
    "Your browser asks not to be tracked (a “Global Privacy Control” or “Do Not Track” signal). We respect that, so you're not counted. Nothing else to do.",
  refus: "Noted. A small cookie remembers your choice for 13 months in this browser, and that's all it does. If you clear your cookies, you'll need to choose again.",
  proposition: "Would you rather not be counted, even anonymously? One click is all it takes. We keep your choice for 13 months in a small cookie that does nothing else.",
  compterANouveau: "Count me again",
  nePlusCompter: "Stop counting me",
};
