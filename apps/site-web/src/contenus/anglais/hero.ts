import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_HERO } from "~/contenus/hero";

export const TEXTES_HERO_ANGLAIS: Traduction<typeof TEXTES_HERO> = {
  badge: "🛠️ App in the works · coming soon all over France",
  titre: { debut: "Rescue a table,", fin: "treat yourself." },
  texte:
    "SOS Miam will introduce you to the restaurants, bars and patisseries near you (and a few things to do) that would love a few more faces: the gem that's just opened, the quiet dining room on a Tuesday night, or the place going through a tough time. Miam (say “mee-yam”) is French for yum!",
  boutons: { inscription: "Sign me up", lieu: "I run a venue" },
  chiffres: [
    { valeur: "3", texte: "rescues a week" },
    { valeur: "7 days", texte: "in the spotlight for a BIG SOS" },
    { valeur: "Zero", texte: "commission" },
  ],
  maquette: {
    pres: "📍 Near you",
    rescousse: "To the rescue!",
    legende: "📱 A preview of the app, still in development",
  },
};
