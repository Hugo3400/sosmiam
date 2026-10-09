import { createDecipheriv } from "node:crypto";

const BASE64URL = /^[A-Za-z0-9_-]*$/;

/**
 * Déchiffre une valeur écrite par chiffrerDonnee (« v1:iv:tag:donnees », base64url) avec la même clé et le même contexte.
 * Lève une erreur (sans jamais citer la valeur) si le format est inconnu, la clé fausse ou la donnée retouchée.
 */
export function dechiffrerDonnee(chiffre: string, cle: Uint8Array, contexte = ""): string {
  if (cle.length !== 32) throw new Error("La clé de chiffrement doit faire 32 octets");
  const morceaux = chiffre.split(":");
  const [version, iv, tag, donnees] = morceaux;
  if (morceaux.length !== 4 || version !== "v1" || !iv || !tag || donnees === undefined || ![iv, tag, donnees].every((m) => BASE64URL.test(m))) {
    throw new Error("Donnée chiffrée illisible (format inconnu)");
  }
  const ivOctets = Buffer.from(iv, "base64url");
  const tagOctets = Buffer.from(tag, "base64url");
  if (ivOctets.length !== 12 || tagOctets.length !== 16) throw new Error("Donnée chiffrée illisible (format inconnu)");
  const dechiffreur = createDecipheriv("aes-256-gcm", cle, ivOctets, { authTagLength: 16 });
  dechiffreur.setAAD(Buffer.from(contexte, "utf8"));
  dechiffreur.setAuthTag(tagOctets);
  return Buffer.concat([dechiffreur.update(Buffer.from(donnees, "base64url")), dechiffreur.final()]).toString("utf8");
}
