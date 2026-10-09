import { normaliserNomCommune } from "../geo/normaliser-nom-commune.ts";

/** Mots qui ne distinguent pas un lieu d'un autre (« Restaurant Le 140 » et « Le 140 » sont le même) */
const MOTS_VIDES = new Set(["restaurant", "resto", "le", "la", "les", "l", "chez", "bar", "cafe", "brasserie", "the", "et", "de", "du", "des", "d"]);

/** Forme de comparaison d'un nom de lieu : sans accents, signes ni majuscules, sans les mots qui ne distinguent rien. */
export function simplifierNomLieu(nom: string): string {
  const mots = normaliserNomCommune(nom).split(" ").filter(Boolean);
  const utiles = mots.filter((mot) => !MOTS_VIDES.has(mot));
  return (utiles.length ? utiles : mots).join(" ");
}
