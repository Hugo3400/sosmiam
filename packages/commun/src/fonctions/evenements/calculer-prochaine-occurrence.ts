import { listerOccurrencesEvenement, type RepetitionEvenement } from "./lister-occurrences-evenement.ts";

/** Bien après toutes les dates possibles (3 mois à l'avance au plus) */
const LOINTAIN = new Date(8.64e15);

/**
 * La prochaine date d'un événement qui n'est pas encore finie à `maintenant` (celle en cours, s'il y en a une), ou null :
 * l'événement est passé. Ne regarde pas l'annulation : c'est à l'appelant de la vérifier.
 */
export function calculerProchaineOccurrence(e: RepetitionEvenement, maintenant: Date): { debut: Date; fin: Date | null } | null {
  return listerOccurrencesEvenement(e, maintenant, LOINTAIN)[0] ?? null;
}
