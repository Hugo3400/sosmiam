import { createCipheriv, randomBytes } from "node:crypto";

/**
 * Chiffre un fichier (photo ou note vocale du chat) en AES-256-GCM avec une sous-clé de 32 octets. Rend
 * « v<version>: » (en ASCII, comme le début d'un texte chiffré) | iv (12 octets, tiré au hasard à chaque fois) |
 * tag (16 octets) | données. La version est celle de la clé maître dont la sous-clé est tirée (1 à 999) : elle dit quelle
 * clé relira le fichier après un changement de clé. `contexte` (« fichier:<nom> ») est authentifié sans être chiffré, et
 * obligatoire : un fichier renommé ou recopié sous un autre nom ne se relit plus. Fonction pure, à part le tirage de l'iv.
 */
export function chiffrerOctets(octets: Uint8Array, cle: Uint8Array, version: number, contexte: string): Buffer {
  if (cle.length !== 32) throw new Error("La clé de chiffrement doit faire 32 octets");
  if (!Number.isInteger(version) || version < 1 || version > 999) throw new Error("Version de clé invalide (1 à 999)");
  if (!contexte) throw new Error("Un fichier chiffré a besoin d'un contexte");
  const iv = randomBytes(12);
  const chiffreur = createCipheriv("aes-256-gcm", cle, iv);
  chiffreur.setAAD(Buffer.from(contexte, "utf8"));
  const donnees = Buffer.concat([chiffreur.update(octets), chiffreur.final()]);
  return Buffer.concat([Buffer.from(`v${version}:`, "latin1"), iv, chiffreur.getAuthTag(), donnees]);
}
