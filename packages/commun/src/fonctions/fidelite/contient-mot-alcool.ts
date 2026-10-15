import { EXPRESSIONS_ALCOOL, MOTS_ALCOOL } from "../../regles/fidelite.ts";

const LETTRE = "[\\p{L}\\p{N}]";
const SEPARATEUR = "[^\\p{L}\\p{N}]+";

const ecrireMotif = (expression: string) => expression.split(" ").map((mot) => `${mot}[sx]?`).join(SEPARATEUR);

const ALCOOL = new RegExp(`(?<!${LETTRE})(?:${[...EXPRESSIONS_ALCOOL, ...MOTS_ALCOOL].map(ecrireMotif).join("|")})(?!${LETTRE})`, "u");

/**
 * Vrai si le texte contient un mot d'alcool (MOTS_ALCOOL), en mot entier, sans tenir compte des accents, des
 * majuscules ni de la ponctuation : « Un verre de Picpoul », « l'apéro », « 2 Bières ! », au pluriel aussi (« Mojitos »,
 * « Kirs offerts »). « Vinaigrette » ne compte pas.
 */
export function contientMotAlcool(texte: string): boolean {
  const simplifie = texte.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return ALCOOL.test(simplifie);
}
