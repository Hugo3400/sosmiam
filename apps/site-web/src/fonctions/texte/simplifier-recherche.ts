import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

/**
 * Prépare un nom de lieu pour la comparaison : sans accents, ligatures ni majuscules, et tirets, espaces et apostrophes
 * (droite ou courbe, celle des iPhone) ramenés à une seule espace : « Provence-Alpes-Côte d’Azur » → « provence alpes cote d azur ».
 * Les abréviations « St » et « Ste » suivies d'un autre mot deviennent « saint » et « sainte » (« st » seul reste « st » : Strasbourg).
 */
export function simplifierRecherche(texte: string): string {
  return normaliserRecherche(texte)
    .replace(/[\s'’.-]+/g, " ")
    .trim()
    .replace(/\bste (?=\S)/g, "sainte ")
    .replace(/\bst (?=\S)/g, "saint ");
}
