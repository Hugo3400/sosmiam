import { createPublicKey, verify } from "node:crypto";

/** Vérifie une signature Ed25519 (64 octets) d'un message, avec une clé publique brute de 32 octets. */
export function verifierSignatureEd25519(clePublique: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
  if (clePublique.length !== 32 || signature.length !== 64) return false;
  try {
    const cle = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(clePublique).toString("base64url") }, format: "jwk" });
    return verify(null, message, cle, signature);
  } catch {
    return false;
  }
}
