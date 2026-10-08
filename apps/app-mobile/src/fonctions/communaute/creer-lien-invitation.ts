/** Adresse de base des invitations : le site saura l'ouvrir (et l'app la reconnaître) avec les comptes */
const DEBUT_LIEN = "https://sosmiam.fr/invitation/";

/**
 * Le lien d'invitation d'une personne, à partager ou à mettre dans un QR code : « https://sosmiam.fr/invitation/<pseudo> ».
 * Le pseudo est rangé sans « @ » et en minuscules, comme dans les profils.
 */
export function creerLienInvitation(pseudo: string): string {
  const propre = pseudo.trim().replace(/^@/, "").toLowerCase();
  return `${DEBUT_LIEN}${encodeURIComponent(propre)}`;
}
