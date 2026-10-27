import type { Traduction } from "../../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_PAGES_LEGALES } from "~/contenus/legal/liens-legaux";

export const TEXTES_PAGES_LEGALES_ANGLAIS: Traduction<typeof TEXTES_PAGES_LEGALES> = {
  pages: {
    mentionsLegales: { texte: "Legal notice", resume: "Who publishes SOS Miam, who hosts it, and how to report content." },
    confidentialite: { texte: "Privacy", resume: "What we do with your data, how long we keep it, and your rights." },
    cookies: { texte: "Cookies", resume: "Every cookie we set, what it's for, how long it lasts, and your choice." },
    cgu: { texte: "Terms of use", resume: "The house rules for the site and the app." },
    accessibilite: { texte: "Accessibility", resume: "What already works, what's in progress, and how to let us know." },
    age: { texte: "SOS Miam and age", resume: "An account from 18, and some pointers for parents." },
    prevention: { texte: "Health and prevention", resume: "Alcohol, the road, eating well and moving, and where to find help." },
    statistiques: { texte: "Visit statistics", resume: "How we count visits without cookies, and how to opt out." },
  },
  gererCookies: "Manage my cookies",
  aLireAussi: "Also worth a read",
};
