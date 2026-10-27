import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_HERO_ANGLAIS } from "~/contenus/anglais/hero";

export const TEXTES_HERO = {
  badge: "🛠️ App en développement · bientôt partout en France",
  titre: { debut: "Sauve une table,", fin: "régale-toi." },
  texte:
    "SOS Miam va te faire découvrir les restos, bars et pâtisseries de ton coin (et quelques sorties) qui ont besoin de monde : la pépite qui vient d'ouvrir, la salle calme un mardi soir, ou le lieu qui traverse un coup dur.",
  boutons: { inscription: "Je m'inscris", lieu: "J'ai un lieu" },
  chiffres: [
    { valeur: "3", texte: "rescousses par semaine" },
    { valeur: "7 j", texte: "à la une pour un BIG SOS" },
    { valeur: "0 €", texte: "de commission" },
  ],
  maquette: {
    pres: "📍 Près de chez toi",
    rescousse: "À la rescousse !",
    legende: "📱 Aperçu de l'app, encore en développement",
  },
};

export const TEXTES_HERO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_HERO>> = {
  fr: TEXTES_HERO,
  en: TEXTES_HERO_ANGLAIS,
};
