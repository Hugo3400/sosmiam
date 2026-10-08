import { randomBytes } from "node:crypto";

import { calculerScrypt } from "./calculer-scrypt.ts";

/**
 * Réglages figés (docs/decisions.md, 8 octobre 2026) : N = 2^14, r = 8, p = 5, l'équivalent recommandé par l'OWASP.
 * 16 Mio de mémoire par calcul (sous la limite par défaut de Node, 32 Mio), environ 0,3 seconde sur le serveur.
 */
export const REGLAGES_SCRYPT = { N: 16384, r: 8, p: 5 } as const;

/**
 * Empreinte d'un mot de passe, la seule chose gardée dans la base : scrypt avec un sel aléatoire de 16 octets et une clé
 * de 32 octets, écrite « scrypt$16384$8$5$<sel>$<empreinte> » (base64url) pour pouvoir changer de réglages un jour.
 * Le mot de passe est d'abord normalisé (NFC) : un « é » tapé sur un téléphone ou sur un ordinateur donne la même empreinte.
 */
export async function hacherMotDePasse(motDePasse: string): Promise<string> {
  const { N, r, p } = REGLAGES_SCRYPT;
  const sel = randomBytes(16);
  const cle = await calculerScrypt(motDePasse.normalize("NFC"), sel, 32, { N, r, p });
  return ["scrypt", N, r, p, sel.toString("base64url"), cle.toString("base64url")].join("$");
}
