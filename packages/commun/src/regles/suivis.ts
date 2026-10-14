// Règles de suivi entre personnes (décidées le 8 octobre 2026, voir docs/decisions.md « Suivre et abonnements »).
import type { Confidentialite } from "../types/suivis.ts";

/** Un compte est public tant qu'il ne choisit pas « privé » (estComptePrive). */
export const CONFIDENTIALITE_PAR_DEFAUT: Confidentialite = "public";

/** Une demande de suivi (compte privé) expire au bout de 30 jours ; un refus reste noté jusque-là (choix de construction) */
export const DUREE_DEMANDE_SUIVI_JOURS = 30;
/** Abonnements à des personnes, par compte (choix de construction) */
export const MAX_ABONNEMENTS = 2000;
