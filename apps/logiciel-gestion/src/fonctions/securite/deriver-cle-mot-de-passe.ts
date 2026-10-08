/** Nombre d'itérations PBKDF2-SHA256 (recommandation OWASP) : une demi-seconde environ, à chaque déverrouillage. */
export const ITERATIONS_MOT_DE_PASSE = 600_000;

/** Clé AES-256-GCM tirée du mot de passe et d'un sel : elle chiffre la clé secrète du poste sur le disque. */
export async function deriverCleMotDePasse(motDePasse: string, sel: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(motDePasse.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: sel, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
