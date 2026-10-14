import { hkdfSync } from "node:crypto";

/**
 * Sous-clé de 32 octets tirée de la clé maître par HKDF-SHA256 (RFC 5869), sans sel, avec ce contexte (« info ») : chaque
 * usage a son contexte, donc sa propre clé, et aucune sous-clé ne permet de retrouver la clé maître ni les autres.
 */
export function deriverSousCle(cleMaitre: Uint8Array, contexte: string): Buffer {
  if (cleMaitre.length < 32) throw new Error("La clé maître doit faire au moins 32 octets");
  if (!contexte) throw new Error("Une sous-clé a besoin d'un contexte");
  return Buffer.from(hkdfSync("sha256", cleMaitre, Buffer.alloc(0), Buffer.from(contexte, "utf8"), 32));
}
