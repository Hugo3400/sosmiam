import { NOM_COOKIE_CONSENTEMENT } from "~/contenus/cookies-consentement";
import { calculerFinConsentement } from "~/fonctions/consentement/calculer-fin-consentement";
import type { ChoixConsentement, ReglagesCookieConsentement } from "~/types/consentement";

/**
 * Le cookie « sosmiam-consentement » d'un choix, prêt pour un en-tête Set-Cookie (serveur) ou pour document.cookie
 * (navigateur) : JSON compact {"v":version,"d":date en secondes,"c":{"publicite":0}}, encodé pour l'adresse, valable
 * jusqu'à 6 mois après le choix. Pas HttpOnly : le navigateur le lit pour savoir quoi charger. Strictement nécessaire :
 * il ne contient que le choix, aucun identifiant.
 */
export function ecrireCookieConsentement(choix: ChoixConsentement, reglages: ReglagesCookieConsentement, maintenant: number): string {
  const secondes = Math.floor(choix.date / 1000);
  const reponses = Object.fromEntries(Object.entries(choix.reponses).map(([id, accepte]) => [id, accepte ? 1 : 0]));
  const valeur = encodeURIComponent(JSON.stringify({ v: choix.version, d: secondes, c: reponses }));
  const duree = Math.max(0, Math.floor((calculerFinConsentement(secondes * 1000) - maintenant) / 1000));
  return [
    `${NOM_COOKIE_CONSENTEMENT}=${valeur}`,
    `Max-Age=${duree}`,
    "Path=/",
    ...(reglages.domaine ? [`Domain=${reglages.domaine}`] : []),
    "SameSite=Lax",
    ...(reglages.securise ? ["Secure"] : []),
  ].join("; ");
}
