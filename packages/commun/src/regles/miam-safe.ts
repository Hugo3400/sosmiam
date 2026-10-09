// Règles de Miam Safe : se sentir en sécurité dans un lieu (décidé le 9 octobre 2026, voir docs/decisions.md).

/** La phrase à dire au comptoir d'un lieu Miam Safe, sur le principe de « Demande Angela » */
export const PHRASE_MIAM_SAFE = "Le Capitaine est là ?";

/** Combien de temps un pote de ta bande voit ta position, quand tu le préviens (arrêtable à tout moment) */
export const DUREE_PARTAGE_POSITION_MINUTES = 60;

/** Sans « On arrive » du lieu après ce délai, l'app propose les secours ou un pote, et l'alerte remonte à l'équipe SOS Miam */
export const DELAI_RELANCE_ALERTE_SECONDES = 120;

/** Un signalement Miam Safe est lu par l'équipe dans ce délai (promis aux Miamis) */
export const DELAI_LECTURE_SIGNALEMENT_HEURES = 48;

/** Le repère « Les Miamis s'y sentent bien » : au moins 90 % de oui… */
export const PART_MIN_REPERE_SENTI_BIEN = 0.9;
/** … sur au moins 20 réponses */
export const REPONSES_MIN_REPERE_SENTI_BIEN = 20;

/** Où l'on est dans le lieu, pour l'alerte silencieuse au comptoir */
export const ENDROITS_ALERTE = ["salle", "terrasse", "toilettes", "ailleurs"] as const;
export type EndroitAlerte = (typeof ENDROITS_ALERTE)[number];

/** Longueur maximale du petit détail qui aide l'équipe à te trouver (« table 12, pull vert ») */
export const LONGUEUR_MAX_DETAIL_ALERTE = 80;

/** Ce qu'on peut raconter après coup sur un lieu (jamais affiché sur sa fiche) */
export const RAISONS_SIGNALEMENT_MIAM_SAFE = ["harcelement", "agression", "discrimination", "personnel", "autre"] as const;
export type RaisonSignalementMiamSafe = (typeof RAISONS_SIGNALEMENT_MIAM_SAFE)[number];
