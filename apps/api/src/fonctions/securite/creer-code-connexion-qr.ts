import { randomInt } from "node:crypto";

/** Les caractères d'un code de QR de connexion : minuscules et chiffres de 2 à 9 (ni 0 ni 1, qu'on confond avec o et l) */
export const ALPHABET_CODE_QR = "abcdefghijklmnopqrstuvwxyz23456789";
/** Longueur du code : 32 caractères parmi 34, soit plus de 160 bits */
export const LONGUEUR_CODE_QR = 32;
/** Forme d'un code de QR de connexion */
export const FORME_CODE_QR = /^[a-z2-9]{32}$/;

/** Un code de QR de connexion (https://sosmiam.fr/q/<code>), tiré au sort avec le générateur sûr de Node. */
export function creerCodeConnexionQr(): string {
  let code = "";
  for (let i = 0; i < LONGUEUR_CODE_QR; i++) code += ALPHABET_CODE_QR[randomInt(ALPHABET_CODE_QR.length)];
  return code;
}
