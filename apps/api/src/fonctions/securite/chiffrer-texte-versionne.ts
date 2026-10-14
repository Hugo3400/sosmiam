import { chiffrerDonnee } from "./chiffrer-donnee.ts";

/**
 * Chiffre un texte de la partie sociale (message, titre de groupe, code d'invitation, instantané d'un signalement) en
 * AES-256-GCM avec une SOUS-CLÉ de la clé des données (32 octets) et la version de la clé maître dont elle est tirée.
 * Rend « v<version>:iv:tag:donnees » (base64url), le format de chiffrerDonnee : la version dit quelle sous-clé relira le
 * texte après un changement de clé (docs/procedure-changement-cle.md). `contexte` (« conversation:12:titre »…) est
 * authentifié sans être chiffré, et obligatoire : un chiffré recopié ailleurs ne se relit plus. Fonction pure, à part le
 * tirage de l'iv.
 */
export function chiffrerTexteVersionne(texte: string, cle: { version: number; cle: Uint8Array }, contexte: string): string {
  if (!contexte) throw new Error("Un texte chiffré a besoin d'un contexte");
  return chiffrerDonnee(texte, cle.cle, contexte, cle.version);
}
