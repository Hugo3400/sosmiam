// Même règle que le site (apps/site-web/src/fonctions/texte/verifier-email.ts) : à rassembler dans packages/commun.
/** Vérifie qu'une adresse e-mail a une forme valable (quelque@domaine.ext) et une longueur acceptable. */
export function verifierEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
