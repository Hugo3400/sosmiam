import { EXPRESSIONS_OPEN_BAR } from "../../regles/evenements.ts";

/**
 * Vrai si le texte promet de boire à volonté (« open bar », « à volonté », « illimité », « boissons gratuites »…), sans
 * tenir compte des accents, des majuscules ni de la ponctuation. Interdit dans un événement avec alcool : la loi interdit
 * d'offrir de l'alcool à volonté ou contre un forfait, et SOS Miam n'en fait jamais la promotion.
 */
export function contientOpenBar(texte: string): boolean {
  const simplifie = texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return EXPRESSIONS_OPEN_BAR.some((expression) => expression.test(simplifie));
}
