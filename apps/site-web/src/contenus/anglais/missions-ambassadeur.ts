import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_MISSIONS_AMBASSADEUR } from "~/contenus/missions-ambassadeur";

export const TEXTES_MISSIONS_AMBASSADEUR_ANGLAIS: Traduction<typeof TEXTES_MISSIONS_AMBASSADEUR> = {
  meta: { titre: "My missions", description: "The missions in your SOS Miam ambassador area." },
  titre: "My missions",
  chapo: "Ways to lend a hand, suggested by the team, at your own pace: no set hours, no targets. Sometimes there's a date – it's a wish, not an obligation.",
  bravo: "Mission complete, well done! Thanks for your report.",
  aucune: "No missions for now. When the team gives you one, it'll land here.",
  groupes: { "a-faire": "To do", faites: "Done", annulees: "Cancelled" },
  messages: {
    tropCourt: "Write a few words about what you did (5 to 2,000 characters).",
    introuvable: "This mission isn't open any more – the team may have cancelled it.",
    panne: "Oops, your report didn't go through. Try again in a moment.",
  },
  carte: {
    avant: "Ideally before ",
    faiteLe: "Done on ",
    annulee: "Cancelled by the team",
    cEstFait: "Done it!",
    pourLecteurs: (titre: string) => `: ${titre}`,
    compteRendu: "Your report",
    aide: "What you did, in a few words (at least 5 characters).",
  },
};
