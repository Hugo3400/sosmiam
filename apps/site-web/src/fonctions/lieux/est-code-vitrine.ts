// Aucun import « ~/… » ici : le test (tests/qr-vitrine.test.ts) lance ce fichier directement avec Node.

/** Forme du code du QR de vitrine (https://sosmiam.fr/l/<code>, construireLienLieu de packages/commun) : 8 caractères a-z et 2-9 */
const FORME_CODE_VITRINE = /^[a-z2-9]{8}$/;

/** Vrai si `code` a la forme d'un code de QR de vitrine (minuscules seulement, comme l'API). */
export function estCodeVitrine(code: string | undefined): code is string {
  return typeof code === "string" && FORME_CODE_VITRINE.test(code);
}
