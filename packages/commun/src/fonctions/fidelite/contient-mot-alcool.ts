import { EXPRESSIONS_ALCOOL, EXPRESSIONS_SANS_ALCOOL, MOTS_ALCOOL } from "../../regles/fidelite.ts";

const LETTRE = "[\\p{L}\\p{N}]";
const SEPARATEUR = "[^\\p{L}\\p{N}]+";

const ecrireMotif = (expression: string) => expression.split(" ").map((mot) => `${mot}[sx]?`).join(SEPARATEUR);
const chercherEnMotsEntiers = (motifs: readonly string[], drapeaux: string) => new RegExp(`(?<!${LETTRE})(?:${motifs.join("|")})(?!${LETTRE})`, drapeaux);

const ALCOOL_SUR = chercherEnMotsEntiers(EXPRESSIONS_ALCOOL.map(ecrireMotif), "u");
const SANS_ALCOOL = chercherEnMotsEntiers(EXPRESSIONS_SANS_ALCOOL.map((expression) => expression.split(" ").join(SEPARATEUR)), "gu");
const ALCOOL = chercherEnMotsEntiers(MOTS_ALCOOL.map(ecrireMotif), "u");

/**
 * Vrai si le texte contient un mot d'alcool (MOTS_ALCOOL), en mot entier, sans tenir compte des accents, des
 * majuscules ni de la ponctuation : « Un verre de Picpoul », « l'apéro », « 2 Bières ! », au pluriel aussi (« Mojitos »,
 * « Kirs offerts »). « Vinaigrette » ne compte pas.
 */
export function contientMotAlcool(texte: string): boolean {
  const simplifie = texte.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return ALCOOL_SUR.test(simplifie) || ALCOOL.test(simplifie.replace(SANS_ALCOOL, " "));
}
