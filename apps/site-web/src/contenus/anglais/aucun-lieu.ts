import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_AUCUN_LIEU } from "~/contenus/aucun-lieu";

export const TEXTES_AUCUN_LIEU_ANGLAIS: Traduction<typeof TEXTES_AUCUN_LIEU> = {
  titre: {
    indisponible: "Places are taking a little break",
    vide: "The first gems are on their way",
  },
  texte: {
    indisponible: "We can't show the places right now. Check back in a moment!",
    vide: "No places are published yet: the first restaurants, bars and patisseries (and a few things to do) arrive with the launch, all over France. Only the real thing here – no fake places just to look good.",
  },
  previensMoi: "Let me know at launch",
  proposer: "Suggest a gem",
  courriel: {
    objet: "I'd like to suggest a place to SOS Miam",
    texte: "Hi SOS Miam team,\n\nName of the place: \nCity and neighbourhood: \nWhy it deserves a busier room: \n",
  },
};
