import { timingSafeEqual } from "node:crypto";

import { calculerScrypt } from "./calculer-scrypt.ts";

const BASE64URL = /^[A-Za-z0-9_-]+$/;
/** Mémoire d'un calcul (128 × N × r octets) : pas plus que la limite par défaut de Node (32 Mio) */
const MEMOIRE_MAX = 32 * 1024 * 1024;

/** Réglage écrit dans l'empreinte, s'il est un nombre entier raisonnable */
function lireReglage(texte: string | undefined, minimum: number, maximum: number): number | null {
  const valeur = texte && /^\d{1,7}$/.test(texte) ? Number(texte) : NaN;
  return valeur >= minimum && valeur <= maximum ? valeur : null;
}

/**
 * Vérifie un mot de passe contre son empreinte « scrypt$N$r$p$<sel>$<empreinte> » (voir hacherMotDePasse), avec une
 * comparaison en temps constant. Une empreinte mal formée, ou aux réglages hors des bornes raisonnables, donne simplement
 * false : jamais de calcul démesuré. Seule erreur possible : la file des calculs pleine (`status: 503`), qui n'est pas un
 * mauvais mot de passe (ni un échec à compter) ; elle remonte telle quelle.
 */
export async function verifierMotDePasse(motDePasse: string, empreinte: string): Promise<boolean> {
  const [algorithme, n, r, p, selTexte, cleTexte, ...reste] = empreinte.split("$");
  if (algorithme !== "scrypt" || reste.length > 0 || !selTexte || !cleTexte || !BASE64URL.test(selTexte) || !BASE64URL.test(cleTexte)) {
    return false;
  }
  const N = lireReglage(n, 1024, 1_048_576);
  const blocs = lireReglage(r, 1, 32);
  const passes = lireReglage(p, 1, 16);
  if (N === null || blocs === null || passes === null || (N & (N - 1)) !== 0 || 128 * N * blocs > MEMOIRE_MAX) return false;
  const sel = Buffer.from(selTexte, "base64url");
  const attendue = Buffer.from(cleTexte, "base64url");
  if (sel.length < 16 || sel.length > 64 || attendue.length < 16 || attendue.length > 64) return false;
  try {
    const calculee = await calculerScrypt(motDePasse.normalize("NFC"), sel, attendue.length, { N, r: blocs, p: passes });
    return timingSafeEqual(calculee, attendue);
  } catch (erreur) {
    if (erreur instanceof Error && "status" in erreur && erreur.status === 503) throw erreur;
    return false;
  }
}
