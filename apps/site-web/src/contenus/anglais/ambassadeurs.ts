import { accorder } from "../../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_AMBASSADEURS } from "~/contenus/ambassadeurs";

export const TEXTES_AMBASSADEURS_ANGLAIS: Traduction<typeof TEXTES_AMBASSADEURS> = {
  paliers: [
    { titre: "Taster", texte: "Everyone starts here, eyes wide open." },
    { titre: "Gem Hunter", texte: "You've got an eye for spotting the good places." },
    { titre: "Neighbourhood Ambassador", texte: "Your neighbourhood has no secrets from you." },
    { titre: "City Ambassador", texte: "Not about points – the SOS Miam team picks them from your city's founders." },
  ],
  points: (nombre: number) => `${nombre} ${accorder(nombre, "en", "point", "points")}`,
  nommeParEquipe: "Chosen by the team",
  missions: [
    { fort: "Spot", suite: "the gems near you and suggest them to us." },
    { fort: "Update", suite: "the places' pages: opening hours, dishes, what's new." },
    { fort: "Approve and create", suite: "selections, like “The best cafés in the neighbourhood”." },
    { fort: "Spread the word", suite: "to the people around you and on your socials." },
  ],
  avantages: [
    { fort: "A badge", suite: "for every level you reach." },
    { fort: "“Spotted by you”:", suite: "your first name on the page of every place you bring in." },
    { fort: "Points", suite: "to climb the levels." },
    { fort: "For each city's founders:", suite: "a numbered card, your first name in the window and early access to the app." },
  ],
};
