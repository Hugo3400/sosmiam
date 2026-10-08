// FNV-1a sur 64 bits (BigInt, que Hermes gère), rendu en base64url de 11 caractères.
// Pas une sécurité : la démo n'a pas de secret. Le vrai QR est signé par l'API.

const BASE_FNV = BigInt("0xcbf29ce484222325");
const PREMIER_FNV = BigInt("0x100000001b3");
const MASQUE_64 = BigInt("0xffffffffffffffff");
const OCTET = BigInt(0xff);
const HUIT = BigInt(8);
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** Octets UTF-8 d'un texte (sans dépendre de TextEncoder) */
function encoderUtf8(texte: string): number[] {
  const octets: number[] = [];
  for (const caractere of texte) {
    const point = caractere.codePointAt(0) ?? 0;
    if (point < 0x80) octets.push(point);
    else if (point < 0x800) octets.push(0xc0 | (point >> 6), 0x80 | (point & 0x3f));
    else if (point < 0x10000) octets.push(0xe0 | (point >> 12), 0x80 | ((point >> 6) & 0x3f), 0x80 | (point & 0x3f));
    else octets.push(0xf0 | (point >> 18), 0x80 | ((point >> 12) & 0x3f), 0x80 | ((point >> 6) & 0x3f), 0x80 | (point & 0x3f));
  }
  return octets;
}

/** Base64url sans « = » final : 8 octets donnent 11 caractères */
function encoderBase64Url(octets: number[]): string {
  let texte = "";
  for (let i = 0; i < octets.length; i += 3) {
    const a = octets[i];
    const b = octets[i + 1];
    const c = octets[i + 2];
    texte += ALPHABET[a >> 2];
    texte += ALPHABET[((a & 0x03) << 4) | ((b ?? 0) >> 4)];
    if (b !== undefined) texte += ALPHABET[((b & 0x0f) << 2) | ((c ?? 0) >> 6)];
    if (c !== undefined) texte += ALPHABET[c & 0x3f];
  }
  return texte;
}

/** Signature de démo d'un message de QR du comptoir (11 caractères base64url, toujours la même pour le même message). */
export function signerDemo(message: string): string {
  let empreinte = BASE_FNV;
  for (const octet of encoderUtf8(message)) {
    empreinte ^= BigInt(octet);
    empreinte = (empreinte * PREMIER_FNV) & MASQUE_64;
  }
  const octets: number[] = [];
  for (let i = 7; i >= 0; i--) octets.push(Number((empreinte >> (HUIT * BigInt(i))) & OCTET));
  return encoderBase64Url(octets);
}
