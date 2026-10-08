/**
 * Prépare un texte pour comparer ou chercher : sans accents, majuscules, tirets ni espaces en trop (« Saint-Jean » → « saint jean »),
 * et les lettres liées dépliées, pour trouver « Cœur » en tapant « coeur » (œ → oe, æ → ae).
 */
export function normaliserRecherche(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[\s'’-]+/g, " ")
    .trim();
}
