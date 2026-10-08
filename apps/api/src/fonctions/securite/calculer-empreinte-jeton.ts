import { createHash } from "node:crypto";

/** Empreinte SHA-256 (hexadécimal, 64 caractères) d'un jeton : la base ne garde que ça, jamais le jeton lui-même. */
export function calculerEmpreinteJeton(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}
