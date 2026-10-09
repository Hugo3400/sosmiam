/** Les caractères d'un code public : lettres minuscules et chiffres de 2 à 9 (ni 0 ni 1, qu'on confondrait avec o et l) */
const ALPHABET = "abcdefghijklmnopqrstuvwxyz23456789";

/**
 * Un code public de lieu, celui du QR de vitrine (https://sosmiam.fr/l/<code>) : 8 caractères tirés au hasard.
 * `tirer(max)` rend un entier de 0 à max - 1 (randomInt de node:crypto en vrai).
 */
export function creerCodePublic(tirer: (max: number) => number): string {
  return Array.from({ length: 8 }, () => ALPHABET[tirer(ALPHABET.length)]).join("");
}
