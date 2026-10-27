export const RUBRIQUES_ACTUS = ["portrait", "top-quartier", "bon-plan", "recit-sortie"] as const;

export type RubriqueActus = (typeof RUBRIQUES_ACTUS)[number];

export const LIEUX_RUBRIQUE_ACTUS: Record<RubriqueActus, { min: number; max: number }> = {
  portrait: { min: 1, max: 1 },
  "top-quartier": { min: 3, max: 5 },
  "bon-plan": { min: 1, max: 1 },
  "recit-sortie": { min: 2, max: 5 },
};

export const TITRE_ACTUS_MAX = 70;
export const ACCROCHE_ACTUS_MAX = 140;
export const TEXTE_ACTUS_MAX = 3000;
export const CITATION_ACTUS_MAX = 200;
export const PHOTOS_ACTUS_MAX = 4;
export const REPONSE_LIEU_ACTUS_MAX = 500;

export const ARTICLES_ACTUS_PAR_SEMAINE = 3;
export const POINTS_ARTICLE_ACTUS = 20;
export const MOTS_LUS_PAR_MINUTE = 200;

export const BADGES_ACTUS = [
  { id: "premier-reportage", objectif: 1 },
  { id: "reporter-de-la-brigade", objectif: 5 },
  { id: "grand-reporter", objectif: 20 },
] as const;
