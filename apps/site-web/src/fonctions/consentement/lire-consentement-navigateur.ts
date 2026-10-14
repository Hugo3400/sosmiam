import type { CategorieConsentement } from "~/contenus/cookies-consentement";
import { calculerVersionConsentement } from "~/fonctions/consentement/calculer-version-consentement";
import { choisirCategoriesConsentement } from "~/fonctions/consentement/choisir-categories-consentement";
import { estApercuCookies } from "~/fonctions/consentement/est-apercu-cookies";
import { lireChoixConsentement } from "~/fonctions/consentement/lire-choix-consentement";
import type { ChoixConsentement } from "~/types/consentement";

/**
 * Le consentement tel que le navigateur le voit à cet instant (document.cookie et adresse de la page), pour le code qui
 * vit hors de React (chargerScriptSiConsentement). null sur le serveur. Dans un composant : utiliserConsentement().
 */
export function lireConsentementNavigateur(): { apercu: boolean; categories: CategorieConsentement[]; choix: ChoixConsentement | null } | null {
  if (typeof document === "undefined") return null;
  const apercu = estApercuCookies(window.location.hostname, new URLSearchParams(window.location.search));
  const categories = choisirCategoriesConsentement(apercu);
  return { apercu, categories, choix: lireChoixConsentement(document.cookie, calculerVersionConsentement(categories), Date.now()) };
}
