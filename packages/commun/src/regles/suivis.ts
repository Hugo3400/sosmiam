// Règles de suivi entre personnes (décidées le 8 octobre 2026, voir docs/decisions.md « Suivre et abonnements »).
import type { Confidentialite } from "../types/suivis";

/** Un compte est public tant qu'il ne choisit pas « privé » (estComptePrive). Aucun chiffre de limite n'est décidé. */
export const CONFIDENTIALITE_PAR_DEFAUT: Confidentialite = "public";
