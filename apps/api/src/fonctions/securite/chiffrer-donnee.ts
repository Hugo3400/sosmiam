import { createCipheriv, randomBytes } from "node:crypto";

/**
 * Chiffre une donnée personnelle (nom, date de naissance) en AES-256-GCM avec la clé des données des comptes (32 octets,
 * lue hors de la base). Rend « v<version>:iv:tag:donnees » (base64url) : `version` est celle de la clé (1 par défaut, la
 * toute première ; « v2 » après un changement de clé…), iv de 12 octets tiré au hasard à chaque fois, tag
 * d'authentification de 16 octets. `contexte` (le nom du champ, par exemple) est authentifié sans être chiffré : une
 * valeur recopiée dans une autre colonne ne se déchiffre plus. Fonction pure, à part le tirage de l'iv.
 */
export function chiffrerDonnee(texte: string, cle: Uint8Array, contexte = "", version = 1): string {
  if (cle.length !== 32) throw new Error("La clé de chiffrement doit faire 32 octets");
  if (!Number.isInteger(version) || version < 1 || version > 999) throw new Error("Version de clé invalide (1 à 999)");
  const iv = randomBytes(12);
  const chiffreur = createCipheriv("aes-256-gcm", cle, iv);
  chiffreur.setAAD(Buffer.from(contexte, "utf8"));
  const donnees = Buffer.concat([chiffreur.update(texte, "utf8"), chiffreur.final()]);
  return [`v${version}`, iv.toString("base64url"), chiffreur.getAuthTag().toString("base64url"), donnees.toString("base64url")].join(":");
}
