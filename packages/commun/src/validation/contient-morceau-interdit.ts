import { EXPRESSIONS_PERMISES, MORCEAUX_INTERDITS } from "../regles/mots-interdits.ts";
import { simplifierTexteFiltre } from "./simplifier-texte-filtre.ts";

// Listes comparées sans espaces ni « * » : « fils de pute » → « filsdepute », « pain batard* » → « painbatard »
const compacter = (expression: string) => simplifierTexteFiltre(expression).replace(/[^a-z0-9]/g, "");
const MORCEAUX = MORCEAUX_INTERDITS.map(compacter).filter((morceau) => morceau !== "");
const PERMIS = EXPRESSIONS_PERMISES.map(compacter).filter((permis) => permis !== "");
const LONGUEUR_MIN = Math.min(...MORCEAUX.map((morceau) => morceau.length));

/**
 * Vrai si un mot collé (« filsdepute », « groconnard », un pseudo sans ses points) contient un morceau de
 * MORCEAUX_INTERDITS, une fois retirés les morceaux permis (« salopette », « lopez »). Le mot arrive déjà en minuscules,
 * sans accents ni espaces (formes de preparerFormesFiltre).
 */
export function contientMorceauInterdit(mot: string): boolean {
  if (mot.length < LONGUEUR_MIN) return false;
  // Un permis retiré laisse un trou (« | ») : ses voisins ne se recollent pas en un nouveau morceau
  const reste = PERMIS.reduce((texte, permis) => texte.split(permis).join("|"), mot);
  return MORCEAUX.some((morceau) => reste.includes(morceau));
}
