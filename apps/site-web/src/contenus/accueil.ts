import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_ACCUEIL_ANGLAIS } from "~/contenus/anglais/accueil";

export const TEXTES_ACCUEIL = {
  meta: {
    titre: "SOS Miam : restos, bars et pâtisseries de ton quartier",
    description:
      "Trouve les restos, bars et pâtisseries indépendants près de chez toi, et donne un coup de main aux lieux en SOS. Gratuit, partout en France.",
  },
};

export const TEXTES_ACCUEIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ACCUEIL>> = {
  fr: TEXTES_ACCUEIL,
  en: TEXTES_ACCUEIL_ANGLAIS,
};
