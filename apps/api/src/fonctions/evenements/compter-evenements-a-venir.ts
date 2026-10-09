import { calculerProchaineOccurrence } from "../../../../../packages/commun/src/fonctions/evenements/calculer-prochaine-occurrence.ts";
import type { RepetitionEvenement } from "../../../../../packages/commun/src/fonctions/evenements/lister-occurrences-evenement.ts";

/**
 * Le nombre d'événements à venir parmi ceux d'un lieu : pas annulés, avec une date pas encore finie à `maintenant`. Les
 * suspendus par la modération comptent aussi (republier ne contourne pas la limite). Pour les 10 à venir par lieu.
 */
export function compterEvenementsAVenir(evenements: readonly (RepetitionEvenement & { annuleLe: Date | null })[], maintenant: Date): number {
  return evenements.filter((e) => e.annuleLe === null && calculerProchaineOccurrence(e, maintenant) !== null).length;
}
