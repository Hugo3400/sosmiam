import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_LIEU_PRO_ANGLAIS } from "~/contenus/anglais/lieu-pro";

export const TEXTES_LIEU_PRO = {
  statuts: {
    brouillon: "Ta fiche n'est pas encore publiée : l'équipe SOS Miam la met en ligne bientôt. Tu peux déjà la préparer.",
    masque: "Ta fiche est masquée pour le moment : écris-nous à bonjour@sosmiam.fr si tu ne sais pas pourquoi.",
  },
  voirFiche: "Voir ma fiche publique",
};

export const TEXTES_LIEU_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_LIEU_PRO>> = {
  fr: TEXTES_LIEU_PRO,
  en: TEXTES_LIEU_PRO_ANGLAIS,
};
