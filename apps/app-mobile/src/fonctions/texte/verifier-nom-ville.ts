import { LONGUEUR_MIN_VILLE } from "~/contenus/inscription/villes";

/** « caracteres-refuses » : un chiffre ou un symbole (code postal, emoji…) ; « incomplet » : trop court, ou qui finit par un tiret */
export type VerdictNomVille = "valable" | "caracteres-refuses" | "incomplet";

/**
 * Vérifie une ville mise au propre : rien que des lettres, avec des espaces, des tirets ou des apostrophes entre elles
 * (« Villeneuve-d'Ascq », « Le Grau-du-Roi »). Pas de chiffres ni de symboles : « 34000 » n'est pas une ville.
 */
export function verifierNomVille(nom: string): VerdictNomVille {
  if (/[^\p{L}\p{M}\s'’-]/u.test(nom)) return "caracteres-refuses";
  const bienForme = nom.length >= LONGUEUR_MIN_VILLE && /^\p{L}/u.test(nom) && /[\p{L}\p{M}]$/u.test(nom);
  return bienForme ? "valable" : "incomplet";
}
