const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Décode du base32 (RFC 4648, celui des codes d'authentification), espaces et « = » ignorés. Null si invalide. */
export function decoderBase32(texte: string): Uint8Array | null {
  const propre = texte.toUpperCase().replace(/[\s=]/g, "");
  const octets: number[] = [];
  let tampon = 0;
  let bits = 0;
  for (const caractere of propre) {
    const valeur = ALPHABET.indexOf(caractere);
    if (valeur < 0) return null;
    tampon = (tampon << 5) | valeur;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      octets.push((tampon >> bits) & 0xff);
    }
  }
  return new Uint8Array(octets);
}
