/** Prépare un texte pour comparer ou chercher : sans accents, majuscules, tirets ni espaces en trop (« Saint-Jean » → « saint jean »). */
export function normaliserRecherche(texte: string): string {
  return texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[\s'’-]+/g, " ").trim();
}
