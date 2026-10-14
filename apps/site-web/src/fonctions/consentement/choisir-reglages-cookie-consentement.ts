import { HOTE_AMBASSADEUR, HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";
import type { ReglagesCookieConsentement } from "~/types/consentement";

const DOMAINE = "sosmiam.fr";

/**
 * Où poser le cookie du choix. Sur sosmiam.fr, ambassadeur.sosmiam.fr et pro.sosmiam.fr : « Domain=sosmiam.fr », un seul
 * choix pour les trois (même éditeur, mêmes catégories, portée annoncée dans le bandeau ; et le formulaire sans JavaScript
 * de sosmiam.fr/cookies vaut alors aussi pour les espaces). Contrairement au cookie de session (__Host-, un par hôte), il ne
 * contient rien de secret : il peut être partagé. En aperçu (apercu.sosmiam.fr ou « ?apercu-cookies ») et sur le serveur
 * de développement : seulement l'hôte de la page, pour ne jamais mélanger un choix d'aperçu avec le vrai site.
 */
export function choisirReglagesCookieConsentement(hote: string, apercu: boolean): ReglagesCookieConsentement {
  const nomHote = hote.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  const partage = !apercu && [DOMAINE, HOTE_AMBASSADEUR, HOTE_PRO].includes(nomHote);
  return { domaine: partage ? DOMAINE : undefined, securise: nomHote === DOMAINE || nomHote.endsWith(`.${DOMAINE}`) };
}
