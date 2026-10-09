// Donne validerPropositionLieu de packages/commun telle quelle (jamais recopiée). Depuis le 9 octobre 2026, le filtre des
// gros mots qu'elle utilise importe ses voisins avec « .ts » : un import normal suffit, sans crochet de résolution.
// Garde la forme asynchrone d'origine, pour ne rien changer chez ceux qui l'appellent.
import { validerPropositionLieu } from "../../../../../packages/commun/src/validation/valider-proposition-lieu.ts";

/** Même forme que le résultat de validerPropositionLieu (packages/commun, validation/valider-proposition-lieu.ts) */
export type ValiderPropositionLieu = typeof validerPropositionLieu;
export type ResultatPropositionLieu = ReturnType<ValiderPropositionLieu>;

/** La fonction de packages/commun. */
export function chargerValiderPropositionLieu(): Promise<ValiderPropositionLieu> {
  return Promise.resolve(validerPropositionLieu);
}
