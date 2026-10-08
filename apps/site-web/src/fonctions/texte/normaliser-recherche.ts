/** Prépare un texte pour la recherche, sans accents ni majuscules : « Sète » → « sete ». */
export function normaliserRecherche(texte: string): string {
  return texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
