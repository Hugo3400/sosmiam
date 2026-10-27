import type { CibleDecisionModeration, CibleSignalementSocial, RaisonSignalement } from "../types/signalement.ts";

// Règles des signalements de publications et des contenus sociaux : ce qu'on demande pour qu'ils soient utiles à la modération.

/** Longueur maximale de l'explication écrite */
export const LONGUEUR_MAX_EXPLICATION_SIGNALEMENT = 500;

/** Longueur minimale de l'explication quand elle est obligatoire */
export const LONGUEUR_MIN_EXPLICATION_SIGNALEMENT = 10;

/** Longueur maximale de la précision choisie pour la raison */
export const LONGUEUR_MAX_PRECISION_SIGNALEMENT = 80;

/** Raisons pour lesquelles l'explication est obligatoire (« Autre chose » : sinon on ne sait pas quoi regarder) */
export const RAISONS_AVEC_EXPLICATION_OBLIGATOIRE: readonly RaisonSignalement[] = ["autre"];

/**
 * Raisons qui masquent la publication pour tout le monde dès le premier signalement (décision du 8 octobre 2026, voir docs/decisions.md),
 * avec une alerte à la modération : un modérateur la retire pour de bon (« retenu ») ou la remet en ligne (« rejete »), à la main.
 * Pour les autres raisons, la publication ne disparaît que pour la personne qui signale, en attendant la modération.
 */
export const RAISONS_AVEC_MASQUAGE_IMMEDIAT: readonly RaisonSignalement[] = ["choquant"];

/** Ce qu'on peut signaler dans la partie sociale (un lieu envoyé est un message) */
export const CIBLES_SIGNALEMENT_SOCIAL = ["commentaire", "message", "liste", "profil", "sortie", "groupe", "idee", "comment-idee", "miamis"] as const satisfies readonly CibleSignalementSocial[];

/**
 * Ce que montre « Décisions de la modération » (GET /app/moderation/mes-decisions) : les contenus sociaux, plus un avis et la
 * réponse d'un lieu à un avis, masqués par l'équipe à la relecture (décision du 15/10/2026), pour leur auteur seulement.
 * Ne sert jamais à valider ce qu'on signale par l'app (c'est CIBLES_SIGNALEMENT_SOCIAL).
 */
export const CIBLES_DECISION_MODERATION = [
  ...CIBLES_SIGNALEMENT_SOCIAL, "avis", "reponse-avis", "image-lieu", "article-actu", "reponse-actu",
] as const satisfies readonly CibleDecisionModeration[];

/**
 * Contenus sociaux masqués pour tout le monde au premier signalement « choquant », en attendant la modération. Jamais un
 * profil, une sortie ou un groupe. Seulement si celui qui signale a un e-mail vérifié, un compte d'au moins
 * ANCIENNETE_MIN_MASQUAGE_JOURS, et si ce contenu n'a jamais eu de signalement rejeté (réponse de Hugo du 14/10/2026).
 */
export const CIBLES_AVEC_MASQUAGE_IMMEDIAT: readonly CibleSignalementSocial[] = ["commentaire", "message", "liste", "idee", "comment-idee"];
export const ANCIENNETE_MIN_MASQUAGE_JOURS = 7;

/** On peut contester une décision de la modération pendant 6 mois (DSA) */
export const DUREE_CONTESTATION_JOURS = 183;

/** Une contestation : 10 à 1 000 caractères, sans filtre de mots (on peut citer ce qu'on conteste ; elle ne va qu'à l'équipe) */
export const LONGUEUR_MIN_CONTESTATION = 10;
export const LONGUEUR_MAX_CONTESTATION = 1000;

/** Un signalement, son instantané compris, part 1 an après sa décision */
export const DUREE_GARDE_SIGNALEMENT_JOURS = 365;
