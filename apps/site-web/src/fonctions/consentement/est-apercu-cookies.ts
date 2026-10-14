import { HOTE_APERCU, PARAMETRE_APERCU_COOKIES } from "~/contenus/cookies-consentement";

/**
 * Vrai si la page montre le bandeau d'aperçu : « ?apercu-cookies » dans l'adresse, ou l'hôte apercu.sosmiam.fr. Lu de
 * la même façon par le serveur (adresse demandée) et par le navigateur (window.location).
 */
export function estApercuCookies(hote: string, parametres: URLSearchParams): boolean {
  const nomHote = hote.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return nomHote === HOTE_APERCU || parametres.has(PARAMETRE_APERCU_COOKIES);
}
