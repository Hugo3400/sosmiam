export const RUBRIQUES_ACTUS = ["portrait", "top-quartier", "bon-plan", "recit-sortie"] as const;

export type RubriqueActus = (typeof RUBRIQUES_ACTUS)[number];

export const LIEUX_RUBRIQUE_ACTUS: Record<RubriqueActus, { min: number; max: number }> = {
  portrait: { min: 1, max: 1 },
  "top-quartier": { min: 3, max: 5 },
  "bon-plan": { min: 1, max: 1 },
  "recit-sortie": { min: 2, max: 5 },
};

export const TITRE_ACTUS_MIN = 10;
export const TITRE_ACTUS_MAX = 70;
export const ACCROCHE_ACTUS_MIN = 20;
export const ACCROCHE_ACTUS_MAX = 140;
export const TEXTE_ACTUS_MIN = 300;
export const TEXTE_ACTUS_MAX = 3000;
export const PARAGRAPHES_ACTUS_MAX = 30;
export const FIN_BON_PLAN_MAX_JOURS = 90;
export const CITATION_ACTUS_MAX = 200;
export const PHOTOS_ACTUS_MAX = 4;
export const REPONSE_LIEU_ACTUS_MAX = 500;
export const COMMENTAIRE_ACTUS_MAX = 500;
export const COMMENTAIRES_ACTUS_PAR_PAGE = 50;

export const ARTICLES_ACTUS_PAR_SEMAINE = 3;
export const ARTICLES_ACTUS_PAR_PAGE = 20;
export const CHEMIN_IMAGES_ACTUS = "/app/actus/images";
export const CHEMIN_MES_MEDIAS_ACTUS = "/app/actus/miens/medias";
export const CHEMIN_MEDIAS_ACTUS_GESTION = "/api-gestion/actus/medias";
export const POINTS_ARTICLE_ACTUS = 20;
export const MOTS_LUS_PAR_MINUTE = 200;

export const BADGES_ACTUS = [
  { id: "premier-reportage", objectif: 1 },
  { id: "reporter-du-quartier", objectif: 5 },
  { id: "grand-reporter", objectif: 20 },
] as const;
