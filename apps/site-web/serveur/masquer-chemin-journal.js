// Chemin d'une adresse demandée, tel qu'il peut entrer dans le journal du serveur de production (journaliser-requetes.js).

/**
 * Le chemin seul : sans paramètres (« ?jeton=… », « ?q=… ») ni fragment, et sans ce qu'un chemin peut cacher de
 * personnel : le code d'un QR de connexion (/q/<code> → /q/[code]) et le pseudo d'une invitation
 * (/invitation/<pseudo> → /invitation/[pseudo]), y compris leurs données de navigation (« .data » de React Router).
 * @param {string | undefined} adresse l'adresse de la requête (« /desinscription?jeton=… »)
 * @returns {string}
 */
export function masquerCheminJournal(adresse) {
  const chemin = String(adresse ?? "").split(/[?#]/)[0] || "/";
  return chemin
    .replace(/^\/q\/[^/]+/i, "/q/[code]")
    .replace(/^\/invitation\/[^/]+/i, "/invitation/[pseudo]");
}
