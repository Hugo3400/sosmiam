import { PART_MIN_REPERE_SENTI_BIEN, REPONSES_MIN_REPERE_SENTI_BIEN } from "../../regles/miam-safe.ts";

/**
 * Vrai si la fiche du lieu peut afficher « Les Miamis s'y sentent bien » : assez de réponses à « Tu t'es senti·e bien ici ? »,
 * et assez de oui. Un « non » ne s'affiche jamais : il devient un signalement privé.
 */
export function calculerRepereSentiBien(oui: number, reponses: number): boolean {
  if (!Number.isFinite(oui) || !Number.isFinite(reponses) || reponses < REPONSES_MIN_REPERE_SENTI_BIEN) return false;
  return oui / reponses >= PART_MIN_REPERE_SENTI_BIEN;
}
