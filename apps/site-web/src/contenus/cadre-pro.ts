import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CADRE_PRO_ANGLAIS } from "~/contenus/anglais/cadre-pro";

export const MARQUE_PRO = "pro";

export const NOM_MIAM_SAFE = "Miam Safe";

export const TEXTES_CADRE_PRO = {
  accroche: "SOS Miam pro : ta fiche, ton équipe, tes gourmands. Gratuit, pour toujours.",
  logo: "SOS Miam pro, l'espace des lieux",
  navigation: "Espace pro",
  liens: {
    tableau: "Tableau",
    fiche: "Ma fiche",
    carte: "Ma carte",
    suggestions: "Suggestions",
    equipe: "Mon équipe",
    affichette: "Affichette",
    kit: "Kit média",
    monCompte: "Mon compte",
    connexion: "Se connecter",
    creerCompte: "Créer mon compte",
  },
};

export const TEXTES_CADRE_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CADRE_PRO>> = {
  fr: TEXTES_CADRE_PRO,
  en: TEXTES_CADRE_PRO_ANGLAIS,
};
