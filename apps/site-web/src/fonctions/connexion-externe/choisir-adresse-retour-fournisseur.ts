// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import type { FournisseurExterne } from "../../types/connexion-externe.ts";

/** Les hôtes déclarés chez Apple et Google : derrière nginx, le serveur voit « http:// », le navigateur est en https */
const HOTES_EN_LIGNE = ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr", "apercu.sosmiam.fr"];

/**
 * L'adresse de retour (redirect_uri) pour l'hôte de la demande : https://<hôte>/connexion/<fournisseur>/retour sur les hôtes
 * en ligne (toujours en https, sans port) ; ailleurs (serveur de développement), l'origine telle quelle.
 */
export function choisirAdresseRetourFournisseur(url: URL, fournisseur: FournisseurExterne): string {
  const hote = url.hostname.toLowerCase().replace(/\.$/, "");
  const origine = HOTES_EN_LIGNE.includes(hote) ? `https://${hote}` : url.origin;
  return `${origine}/connexion/${fournisseur}/retour`;
}
