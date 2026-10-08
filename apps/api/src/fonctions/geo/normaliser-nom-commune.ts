/** Accents et autres signes posés sur une lettre, une fois le texte décomposé (NFD) */
const ACCENTS = /[̀-ͯ]/g;
/** Numéro suivi de « e », « er », « re », « eme » ou « ieme » (après retrait des accents) : « 11e », « 1er », « 3ème » */
const ORDINAL = /^(\d+)(?:er|re|e|eme|ieme)$/;

/**
 * Forme de recherche d'un nom de commune : sans accents, en minuscules, « œ » et « æ » écrits « oe » et « ae »,
 * tirets, apostrophes et autres signes changés en espaces (un seul entre deux mots), numéros d'arrondissement sans
 * leur « e » ou « er ». Ex. : « Saint-Étienne-du-Rouvray » → « saint etienne du rouvray », « L'Haÿ-les-Roses » →
 * « l hay les roses », « Paris 11e Arrondissement » → « paris 11 arrondissement ».
 */
export function normaliserNomCommune(texte: string): string {
  const forme = texte
    .normalize("NFD")
    .replace(ACCENTS, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return /\d/.test(forme) ? forme.split(" ").map((mot) => mot.replace(ORDINAL, "$1")).join(" ") : forme;
}
