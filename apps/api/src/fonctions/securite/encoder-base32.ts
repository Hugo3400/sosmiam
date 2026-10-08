const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Encode des octets en base32 (RFC 4648, sans « = »), le format des clés des applications d'authentification. */
export function encoderBase32(octets: Uint8Array): string {
  let resultat = "";
  let tampon = 0;
  let bits = 0;
  for (const octet of octets) {
    tampon = (tampon << 8) | octet;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      resultat += ALPHABET[(tampon >> bits) & 31];
    }
  }
  if (bits > 0) resultat += ALPHABET[(tampon << (5 - bits)) & 31];
  return resultat;
}
