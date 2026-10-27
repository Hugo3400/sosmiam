// Les onglets de la FAQ, dans l'ordre d'affichage. Les questions sont dans un fichier par onglet.
import type { ParLangue, Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_ONGLETS_FAQ_ANGLAIS } from "~/contenus/anglais/faq/onglets-faq";

export const TEXTES_ONGLETS_FAQ = {
  essentiel: { titre: "L'essentiel", titreGroupe: "L'essentiel" },
  "big-sos": { titre: "BIG SOS", titreGroupe: "BIG SOS" },
  app: { titre: "L'app", titreGroupe: "Utiliser l'app" },
  pros: { titre: "Pour les pros", titreGroupe: "Pour les pros" },
  ambassadeurs: { titre: "Ambassadeurs", titreGroupe: "Ambassadeurs & créateurs" },
};

export const TEXTES_ONGLETS_FAQ_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ONGLETS_FAQ>> = {
  fr: TEXTES_ONGLETS_FAQ,
  en: TEXTES_ONGLETS_FAQ_ANGLAIS,
};
