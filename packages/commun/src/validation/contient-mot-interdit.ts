import { EXPRESSIONS_INTERDITES } from "../regles/mots-interdits";

const nettoyer = (texte: string) => ` ${texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

/**
 * Vrai si le texte contient une insulte ou un propos haineux courant (liste de regles/mots-interdits.ts),
 * sans tenir compte des accents, des majuscules ni de la ponctuation. Première barrière, pas une modération.
 */
export function contientMotInterdit(texte: string): boolean {
  const propre = nettoyer(texte);
  return EXPRESSIONS_INTERDITES.some((expression) =>
    expression.endsWith("*") ? propre.includes(` ${expression.slice(0, -1)}`) : propre.includes(` ${expression} `),
  );
}
