/** Prépare un texte pour la recherche, sans accents, ligatures ni majuscules : « Sète » → « sete », « Schœlcher » → « schoelcher ». */
export function normaliserRecherche(texte: string): string {
  return texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae");
}
