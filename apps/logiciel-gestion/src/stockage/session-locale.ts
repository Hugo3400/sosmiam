// La session ouverte avec le code à 6 chiffres, gardée sur ce PC, chiffrée par la clé tirée du mot de passe : en rouvrant
// le logiciel (ou après un verrouillage), le mot de passe suffit tant que la session est valable sur le serveur
// (24 h sans activité, 7 jours au plus). Le cadenas du menu l'efface : le code est alors redemandé.
const CLE = "sosmiam-gestion:session";

export type SessionChiffree = { iv: string; chiffre: string };

export function lireSessionLocale(): SessionChiffree | null {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? "null") as SessionChiffree | null;
    return brut?.iv && brut.chiffre ? brut : null;
  } catch {
    return null;
  }
}

export function ecrireSessionLocale(session: SessionChiffree): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(session));
  } catch {
    // Stockage indisponible : le code sera simplement redemandé à la prochaine ouverture
  }
}

export function oublierSessionLocale(): void {
  try {
    localStorage.removeItem(CLE);
  } catch {
    // rien à faire
  }
}
