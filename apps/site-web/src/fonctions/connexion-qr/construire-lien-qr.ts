// Aucun import « ~/… » ici : les tests (tests/connexion-qr.test.ts) lancent ce fichier directement avec Node.

/** Ce que contient le QR : https://sosmiam.fr/q/<code> (l'app l'ouvre ; sans l'app, la page /q explique quoi faire) */
export function construireLienQr(code: string): string {
  return `https://sosmiam.fr/q/${code}`;
}
