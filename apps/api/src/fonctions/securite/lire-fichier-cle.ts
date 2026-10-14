import { readFileSync, statSync } from "node:fs";

export type LectureFichierCle = { ok: true; cle: Buffer } | { ok: false; absent: boolean; raison: string };

/**
 * Lit un fichier de clé de 32 octets (le base64 de la clé, lisible par son propriétaire seul : chmod 600). Les raisons
 * d'un refus ne citent jamais le contenu du fichier.
 */
export function lireFichierCle(chemin: string): LectureFichierCle {
  let texte: string;
  try {
    if (statSync(chemin).mode & 0o077) return { ok: false, absent: false, raison: "fichier de clé lisible par d'autres comptes : chmod 600" };
    texte = readFileSync(chemin, "utf8");
  } catch {
    return { ok: false, absent: true, raison: "fichier de clé absent ou illisible" };
  }
  const propre = texte.trim();
  const cle = /^[A-Za-z0-9+/]{43}=$/.test(propre) ? Buffer.from(propre, "base64") : null;
  if (!cle || cle.length !== 32) return { ok: false, absent: false, raison: "le fichier doit contenir le base64 de 32 octets" };
  return { ok: true, cle };
}
