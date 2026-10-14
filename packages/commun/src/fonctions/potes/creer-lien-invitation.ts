/** Adresse de base des invitations : le site sait l'ouvrir, et l'app la reconnaître */
const DEBUT_LIEN = "https://sosmiam.fr/invitation/";

/**
 * Le lien d'invitation d'une personne, à mettre dans son QR code : « https://sosmiam.fr/invitation/<pseudo>#c=<code> ».
 * Le pseudo est rangé sans « @ » et en minuscules, comme dans les profils ; le code est son code secret, tiré par l'API,
 * pour qu'un lien ne se fabrique pas à partir du seul pseudo, qui est public. Le code passe dans le fragment (« #c= ») :
 * un navigateur ne l'envoie jamais au serveur, il ne finit donc ni dans les journaux ni dans les statistiques du site.
 */
export function creerLienInvitation(pseudo: string, code: string): string {
  const propre = pseudo.trim().replace(/^@/, "").toLowerCase();
  return `${DEBUT_LIEN}${encodeURIComponent(propre)}#c=${encodeURIComponent(code)}`;
}
