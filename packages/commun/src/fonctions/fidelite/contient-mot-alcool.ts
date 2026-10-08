import { MOTS_ALCOOL } from "../../regles/fidelite.ts";

const MOTS = new Set(MOTS_ALCOOL);

/**
 * Vrai si le texte contient un mot d'alcool (MOTS_ALCOOL), en mot entier, sans tenir compte des accents, des
 * majuscules ni de la ponctuation : « Un verre de Picpoul », « l'apéro », « 2 Bières ! ». « Vinaigrette » ne compte pas.
 */
export function contientMotAlcool(texte: string): boolean {
  const simplifie = texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return simplifie.split(/[^a-z0-9]+/).some((mot) => MOTS.has(mot));
}
