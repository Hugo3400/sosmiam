import type { StatutIdee } from "../types/idees.ts";

export const LONGUEUR_MIN_TITRE_IDEE = 8;
export const LONGUEUR_MAX_TITRE_IDEE = 90;
export const LONGUEUR_MAX_DETAIL_IDEE = 500;
export const ETAPES_IDEE: readonly StatutIdee[] = ["proposee", "a-l-etude", "prevue", "faite"];
