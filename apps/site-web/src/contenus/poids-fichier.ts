import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_POIDS_FICHIER_ANGLAIS } from "~/contenus/anglais/poids-fichier";

export const TEXTES_POIDS_FICHIER = {
  format: "fr-FR",
  kilo: "Ko",
  mega: "Mo",
};

export const TEXTES_POIDS_FICHIER_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_POIDS_FICHIER>> = {
  fr: TEXTES_POIDS_FICHIER,
  en: TEXTES_POIDS_FICHIER_ANGLAIS,
};
