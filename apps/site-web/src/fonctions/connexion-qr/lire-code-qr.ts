// Aucun import « ~/… » ici : les tests (tests/connexion-qr.test.ts) lancent ce fichier directement avec Node.

/** Le code d'un QR de connexion (32 caractères [a-z2-9]) lu dans l'adresse /q/:code, sinon null. */
export function lireCodeQr(valeur: unknown): string | null {
  return typeof valeur === "string" && /^[a-z2-9]{32}$/.test(valeur) ? valeur : null;
}
