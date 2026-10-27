import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_PROPOSER_UN_LIEU } from "~/contenus/proposer-un-lieu";

export const TEXTES_PROPOSER_UN_LIEU_ANGLAIS: Traduction<typeof TEXTES_PROPOSER_UN_LIEU> = {
  meta: { titre: "Suggest a place", description: "Suggest an independent place to SOS Miam." },
  titre: "Suggest a place",
  chapo: (prenom: string) =>
    `An independent restaurant, patisserie, bar or thing to do that deserves a fuller room? Tell us all about it. If it joins SOS Miam, its page will show “Spotted by ${prenom}”.`,
  merci: "Thanks, it's on its way!",
  suivi: "The team reads every suggestion. You can follow how it's going just below.",
  autre: "Suggest another place",
  rappel: "Remember: an ambassador is never paid by a place they feature.",
  mesPropositions: "My suggestions",
  formulaire: {
    bouton: "Send my suggestion",
    description: { libelle: "Why this place?", aide: "What makes it special, the atmosphere, why it deserves a fuller room (20 characters min)." },
    cEstPlutot: "What kind of place? ",
    facultatif: "(optional)",
  },
  messages: {
    description: "Tell us why this place, in 20 to 1,000 characters.",
    tropDeDemandes: "Easy there! Too many in a row. Try again in a few minutes.",
    panne: "Oops, your suggestion didn't go through. Try again in a moment, or drop us a line at bonjour@sosmiam.fr.",
  },
};
