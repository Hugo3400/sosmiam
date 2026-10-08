import { createHmac } from "node:crypto";

/**
 * Code à 6 chiffres d'une application d'authentification (TOTP, RFC 6238 : HMAC-SHA1, pas de 30 secondes)
 * pour le pas de temps donné (secondes depuis 1970 divisées par 30).
 */
export function calculerCodeTotp(secret: Uint8Array, pas: number): string {
  const compteur = Buffer.alloc(8);
  compteur.writeBigUInt64BE(BigInt(pas));
  const hmac = createHmac("sha1", secret).update(compteur).digest();
  const decalage = (hmac[hmac.length - 1] ?? 0) & 0x0f;
  const nombre = hmac.readUInt32BE(decalage) & 0x7fffffff;
  return String(nombre % 1_000_000).padStart(6, "0");
}
