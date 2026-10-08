// Règles de Potes (décidées le 8 octobre 2026, voir docs/decisions.md).

/** Identifiant de la personne qui utilise l'app, dans les sorties, listes et recommandations */
export const ID_MOI = "moi";

/** Pseudo : 3 à 20 caractères, minuscules, chiffres, point et tiret bas, sans commencer ni finir par un point ou un tiret bas */
export const FORME_PSEUDO = /^[a-z0-9](?:[a-z0-9._]{1,18})[a-z0-9]$/;

export const LONGUEUR_MAX_TITRE_SORTIE = 40;
export const LONGUEUR_MAX_MESSAGE = 500;
export const LONGUEUR_MAX_MOT_RECOMMANDATION = 140;
export const MAX_PROPOSITIONS_SORTIE = 8;
export const MAX_PARTICIPANTS_SORTIE = 15;
