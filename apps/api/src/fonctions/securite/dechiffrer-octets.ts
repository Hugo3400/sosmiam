import { createDecipheriv } from "node:crypto";

import { lireVersionChiffre } from "./lire-version-chiffre.ts";

/**
 * Relit un fichier écrit par chiffrerOctets (« v<version>: » | iv | tag | données) : la version écrite en tête choisit la
 * sous-clé (`trouverCle`, null si cette version de clé n'est plus là), et seulement celle-là. Lève une erreur, sans
 * jamais citer le contenu, si le format est inconnu, la clé de cette version absente, le contexte faux (fichier renommé)
 * ou un seul octet retouché.
 */
export function dechiffrerOctets(chiffre: Uint8Array, trouverCle: (version: number) => Uint8Array | null, contexte: string): Buffer {
  if (!contexte) throw new Error("Un fichier chiffré a besoin d'un contexte");
  const octets = Buffer.from(chiffre.buffer, chiffre.byteOffset, chiffre.byteLength);
  const version = lireVersionChiffre(octets.subarray(0, 5).toString("latin1"));
  if (version === null) throw new Error("Fichier chiffré illisible (format inconnu)");
  const debut = `v${version}:`.length;
  if (octets.length < debut + 28) throw new Error("Fichier chiffré illisible (format inconnu)");
  const cle = trouverCle(version);
  if (!cle) throw new Error(`Fichier chiffré illisible (clé de la version ${version} absente)`);
  if (cle.length !== 32) throw new Error("La clé de chiffrement doit faire 32 octets");
  const dechiffreur = createDecipheriv("aes-256-gcm", cle, octets.subarray(debut, debut + 12), { authTagLength: 16 });
  dechiffreur.setAAD(Buffer.from(contexte, "utf8"));
  dechiffreur.setAuthTag(octets.subarray(debut + 12, debut + 28));
  return Buffer.concat([dechiffreur.update(octets.subarray(debut + 28)), dechiffreur.final()]);
}
