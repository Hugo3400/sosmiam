/** Un nom de lieu sans accents, en minuscules, tirets, apostrophes et espaces réduits à une espace : pour comparer
 * « Saint-Étienne » et « saint etienne », ou « L'Haÿ-les-Roses » et « l hay les roses ». */
export function simplifierNom(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-'’\s]+/g, " ").trim();
}
