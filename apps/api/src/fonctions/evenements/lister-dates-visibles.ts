import { listerOccurrencesEvenement } from "../../../../../packages/commun/src/fonctions/evenements/lister-occurrences-evenement.ts";
import type { EvenementLieuPublic } from "../../../../../packages/commun/src/types/evenement.ts";
import type { EvenementAvecLieu } from "../../services/evenements-regles.ts";
import { presenterEvenementPublic } from "./presenter-evenement-public.ts";

/**
 * Les dates des événements (déjà visibles : lieu publié, ni suspendus ni annulés) qui touchent la période [du, au) et ne
 * sont pas encore finies à `maintenant`, dans l'ordre (début, puis numéro de l'événement), `maximum` au plus. Un
 * événement de chaque semaine donne une ligne par date.
 */
export function listerDatesVisibles(evenements: readonly EvenementAvecLieu[], du: Date, au: Date, maintenant: Date, maximum: number): EvenementLieuPublic[] {
  const depuis = du > maintenant ? du : maintenant;
  return evenements
    .flatMap((e) => listerOccurrencesEvenement(e, depuis, au).map((date) => ({ e, date })))
    .sort((a, b) => a.date.debut.getTime() - b.date.debut.getTime() || a.e.id - b.e.id)
    .slice(0, maximum)
    .map(({ e, date }) => presenterEvenementPublic(e, date));
}
