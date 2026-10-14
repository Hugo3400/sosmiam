/**
 * Le code d'un QR de connexion (32 caractères [a-z2-9]) lu dans le texte scanné : https://sosmiam.fr/q/<code>
 * (www. accepté, « / » final toléré) ou le lien de secours sosmiam://q/<code> ; null pour tout autre texte.
 */
export function lireCodeConnexionQr(texte: string): string | null {
  const trouve = /^(?:https:\/\/(?:www\.)?sosmiam\.fr\/q\/|sosmiam:\/\/q\/)([a-z2-9]{32})\/?$/.exec(texte.trim());
  return trouve ? trouve[1] : null;
}
