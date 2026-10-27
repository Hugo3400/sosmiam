import { citer } from "../../fonctions/langue/citer.ts";
import { PHRASE_MIAM_SAFE } from "../../regles/miam-safe.ts";
import type { EngagementCharteMiamSafe } from "../charte-miam-safe.ts";

export const ENGAGEMENTS_CHARTE_MIAM_SAFE_ANGLAIS: readonly EngagementCharteMiamSafe[] = [
  {
    titre: "The whole team knows the phrase and the screen",
    texte: `When someone asks ${citer(PHRASE_MIAM_SAFE, "en")} (Is the Captain here?) or shows the dark screen with Capitaine Bouiboui, it means they need help, without anyone else noticing.`,
  },
  {
    titre: "We take the person aside, quietly",
    texte: "We take them somewhere away from the room, listen, and ask what they need: a taxi, a call to someone they trust, the emergency services. No announcements in the dining room, and no one confronts the person causing the problem alone.",
  },
  {
    titre: "Silent alerts are picked up during service",
    texte: "At least one phone at the counter has the SOS Miam app in Pro mode with notifications turned on. When an alert comes in, we tap “On our way” and go and check, as fast as we can.",
  },
  {
    titre: "We answer the SOS Miam team",
    texte: "If someone tells us about a problem at the venue, the SOS Miam team may contact you. After a serious report, it can withdraw the charter and the badge.",
  },
];
