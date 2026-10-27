import type { Traduction } from "../../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_PAGES_LEGALES } from "~/contenus/legal/liens-legaux";

export const TEXTES_PAGES_LEGALES_ANGLAIS: Traduction<typeof TEXTES_PAGES_LEGALES> = {
  pages: {
    mentionsLegales: { texte: "Legal notice", resume: "Who publishes SOS Miam, who hosts it, and how to report content." },
    confidentialite: { texte: "Privacy", resume: "What we do with your data, for how long, and your rights." },
    cookies: { texte: "Cookies", resume: "Every cookie we set, what it's for, how long it lasts, and your choice." },
    cgu: { texte: "Terms of Use", resume: "The ground rules for the site and the app." },
    accessibilite: { texte: "Accessibility", resume: "What already works, what's in progress, and how to let us know." },
    age: { texte: "Age and SOS Miam", resume: "Accounts are 18+, plus some pointers for parents." },
    prevention: { texte: "Health and wellbeing", resume: "Alcohol, the road, eating well and moving, and where to find help." },
    statistiques: { texte: "Visitor statistics", resume: "How we count visits without cookies, and how to opt out." },
  },
  gererCookies: "Cookie settings",
  aLireAussi: "Also worth a read",
};
