// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import type { EspaceConnexion, PageDepart } from "../../types/connexion-externe.ts";

/**
 * L'espace d'une connexion, d'après l'hôte et la page de départ : « pro » sur pro.sosmiam.fr (et pro.localhost) ;
 * « site » depuis /mon-compte ailleurs (le « Mon compte » de sosmiam.fr) ; « ambassadeur » sinon.
 */
export function choisirEspaceConnexion(hote: string, depart: PageDepart): EspaceConnexion {
  const nomHote = hote.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (nomHote === "pro.sosmiam.fr" || nomHote === "pro.localhost") return "pro";
  return depart === "/mon-compte" ? "site" : "ambassadeur";
}
