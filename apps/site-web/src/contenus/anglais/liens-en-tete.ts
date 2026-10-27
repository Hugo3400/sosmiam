import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_EN_TETE } from "~/contenus/liens-en-tete";

export const TEXTES_EN_TETE_ANGLAIS: Traduction<typeof TEXTES_EN_TETE> = {
  liens: {
    app: { texte: "The app", detail: "How it works, in four simple moves" },
    lieux: { texte: "Places", detail: "Hidden gems that deserve a busier room" },
    bigSos: { texte: "BIG SOS", detail: "Going through a tough time? The Brigade to the rescue" },
    faq: { texte: "FAQ", detail: "Your questions, even the wackiest ones" },
    ambassadeurs: { texte: "Ambassadors", detail: "Share your hidden gems, 18+" },
    pros: { texte: "For venues", detail: "Your venue on SOS Miam – and it's free" },
    monCompte: { texte: "My account", detail: "One account for the app and both areas" },
  },
  groupes: { decouvrir: "Discover", rejoindre: "Join in" },
  previensMoi: "Keep me posted",
  accueil: "SOS Miam, home",
  menuPrincipal: "Main menu",
  menu: "Menu",
  fermer: "Close",
  appBientot: "The app's coming soon, all over France. Shall we give you a shout?",
  bandeauDeveloppement: "🛠️ The SOS Miam app is in the works: it's coming soon, all over France.",
  allerAuContenu: "Skip to content",
};
