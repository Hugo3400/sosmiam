import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_THEMES_SAISON_APP_ANGLAIS } from "~/contenus/anglais/textes-themes-saison-app";

export const TEXTES_THEMES_SAISON_APP = {
  reglageTitre: "Thèmes de saison",
  reglageDetail: "Le Capitaine se déguise au fil de l'année, en haut de « Pour toi »",
} as const;

export const TEXTES_THEMES_SAISON_APP_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_THEMES_SAISON_APP>> = { fr: TEXTES_THEMES_SAISON_APP, en: TEXTES_THEMES_SAISON_APP_ANGLAIS };
