/** Adresse de base des invitations : le site saura l'ouvrir (et l'app la reconnaître) avec les comptes */
const DEBUT_LIEN = "https://sosmiam.fr/invitation/";

/**
 * Le lien d'invitation d'une personne, à mettre dans son QR code : « https://sosmiam.fr/invitation/<pseudo>?c=<code> ».
 * Le pseudo est rangé sans « @ » et en minuscules, comme dans les profils ; le code est son code secret personnel
 * (stockage/code-invitation.ts), pour qu'un lien ne se fabrique pas à partir du seul pseudo, qui est public.
 * Démo : rien ne vérifie encore ce code. C'est l'API qui le vérifiera (et pourra le renouveler) quand les comptes arriveront ;
 * d'ici là, un adulte ne peut ajouter aucun mineur, quel que soit le moyen.
 */
export function creerLienInvitation(pseudo: string, code: string): string {
  const propre = pseudo.trim().replace(/^@/, "").toLowerCase();
  return `${DEBUT_LIEN}${encodeURIComponent(propre)}?c=${encodeURIComponent(code)}`;
}
