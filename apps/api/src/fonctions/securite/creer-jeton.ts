import { randomBytes } from "node:crypto";

/** Jeton aléatoire de 32 octets (256 bits), en base64url : session d'un compte, lien de réinitialisation… */
export function creerJeton(): string {
  return randomBytes(32).toString("base64url");
}
