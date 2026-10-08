import { createHash } from "node:crypto";

/** Identifiant court d'un poste autorisé : les 16 premiers caractères du SHA-256 de sa clé publique (base64url). */
export function calculerIdPoste(clePublique: Uint8Array): string {
  return createHash("sha256").update(clePublique).digest("base64url").slice(0, 16);
}
