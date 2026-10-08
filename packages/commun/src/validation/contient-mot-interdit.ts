import { EXPRESSIONS_INTERDITES } from "../regles/mots-interdits";
import { construireMotifExpressions } from "./construire-motif-expressions";
import { contientMorceauInterdit } from "./contient-morceau-interdit";
import { preparerFormesFiltre } from "./preparer-formes-filtre";

const MOTIF_INTERDIT = construireMotifExpressions(EXPRESSIONS_INTERDITES);

/**
 * Vrai si le texte contient une insulte ou un propos haineux courant (listes de regles/mots-interdits.ts), sans tenir
 * compte des accents, des majuscules ni de la ponctuation, et malgré les ruses habituelles (« connard69 », « c o n n a r d »,
 * « c0nn4rd », « connnnard », « filsdepute »). Pour les commentaires, messages, titres et prénoms ; les pseudos passent
 * par pseudoContientMotInterdit, plus strict. Première barrière, pas une modération.
 */
export function contientMotInterdit(texte: string): boolean {
  const formes = preparerFormesFiltre(texte);
  if (formes.some((forme) => MOTIF_INTERDIT.test(forme))) return true;
  // Les mêmes mots reviennent d'une forme à l'autre : chacun n'est fouillé qu'une fois
  const mots = new Set(formes.flatMap((forme) => forme.split(" ")));
  return [...mots].some((mot) => contientMorceauInterdit(mot));
}
