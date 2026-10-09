import { createHash } from "node:crypto";

/**
 * Empreinte SHA-256 d'un nonce, en hexadécimal minuscule : ce que « Se connecter avec Apple » met dans le jeton quand
 * l'app lui a donné cette empreinte (l'app garde le nonce brut et l'envoie à l'API, qui recalcule l'empreinte).
 */
export function calculerEmpreinteNonce(nonce: string): string {
  return createHash("sha256").update(nonce, "utf8").digest("hex");
}
