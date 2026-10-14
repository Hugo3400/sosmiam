import { createHash } from "node:crypto";

/** Le SHA-256 du nonce, en hexadécimal minuscule : ce qu'Apple reçoit et met dans le jeton (l'API recalcule depuis le nonce brut). */
export function calculerEmpreinteNonce(nonce: string): string {
  return createHash("sha256").update(nonce).digest("hex");
}
