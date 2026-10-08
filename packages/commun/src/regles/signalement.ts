import type { RaisonSignalement } from "../types/signalement";

// Règles des signalements de publications : ce qu'on demande pour qu'ils soient utiles à la modération.

/** Longueur maximale de l'explication écrite */
export const LONGUEUR_MAX_EXPLICATION_SIGNALEMENT = 500;

/** Longueur minimale de l'explication quand elle est obligatoire */
export const LONGUEUR_MIN_EXPLICATION_SIGNALEMENT = 10;

/** Raisons pour lesquelles l'explication est obligatoire (« Autre chose » : sinon on ne sait pas quoi regarder) */
export const RAISONS_AVEC_EXPLICATION_OBLIGATOIRE: readonly RaisonSignalement[] = ["autre"];

/**
 * Raisons qui masquent la publication pour tout le monde dès le premier signalement (décision du 8 octobre 2026, voir docs/decisions.md),
 * avec une alerte à la modération : un modérateur la retire pour de bon (« retenu ») ou la remet en ligne (« rejete »), à la main.
 * Pour les autres raisons, la publication ne disparaît que pour la personne qui signale, en attendant la modération.
 */
export const RAISONS_AVEC_MASQUAGE_IMMEDIAT: readonly RaisonSignalement[] = ["choquant"];
