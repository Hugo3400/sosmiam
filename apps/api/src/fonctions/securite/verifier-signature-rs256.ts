import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

/**
 * Vérifie une signature RS256 (RSA PKCS#1 v1.5 avec SHA-256) avec une clé publique JWK (celles d'Apple et de Google).
 * Faux pour une clé qui n'est pas RSA, qui n'est pas faite pour signer, d'un autre algorithme, trop courte (moins de
 * 2 048 bits) ou illisible.
 */
export function verifierSignatureRs256(contenu: string, signature: Uint8Array, jwk: JsonWebKey): boolean {
  if (jwk.kty !== "RSA" || (jwk.use !== undefined && jwk.use !== "sig") || (jwk.alg !== undefined && jwk.alg !== "RS256")) return false;
  try {
    const cle = createPublicKey({ key: { kty: "RSA", n: jwk.n, e: jwk.e }, format: "jwk" });
    if ((cle.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) return false;
    return verify("sha256", Buffer.from(contenu), cle, signature);
  } catch {
    return false;
  }
}
