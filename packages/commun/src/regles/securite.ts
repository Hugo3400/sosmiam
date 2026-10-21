import type { CibleSignalementSecurite, StatutSignalementSecurite } from "../types/securite.ts";

export const CIBLES_SIGNALEMENT_SECURITE: readonly CibleSignalementSecurite[] = ["site", "espaces", "api", "app-ios", "app-android"];

export const STATUTS_CLOS_SECURITE: readonly StatutSignalementSecurite[] = ["corrige", "non-retenu", "doublon"];

export const IMAGES_SIGNALEMENT_MAX = 3;
export const IMAGE_SIGNALEMENT_OCTETS_MAX = 5 * 1024 * 1024;
export const JOURS_REPONSE_SECURITE = 7;
export const JOURS_PUBLICATION_SECURITE = 90;
export const ANNEES_CONSERVATION_SECURITE = 2;

export const LONGUEURS_SIGNALEMENT_SECURITE = {
  nom: { min: 2, max: 80 },
  titre: { min: 5, max: 120 },
  description: { min: 30, max: 10_000 },
  lien: { min: 0, max: 300 },
  nomTableauHonneur: { min: 2, max: 40 },
} as const;
