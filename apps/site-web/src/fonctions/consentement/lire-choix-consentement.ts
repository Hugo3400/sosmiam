import { IDS_CATEGORIES_FACULTATIVES, NOM_COOKIE_CONSENTEMENT } from "~/contenus/cookies-consentement";
import { calculerFinConsentement } from "~/fonctions/consentement/calculer-fin-consentement";
import type { ChoixConsentement, ReponsesConsentement } from "~/types/consentement";

/** Une valeur du cookie, décodée et vérifiée ; null si elle est abîmée ou bricolée. */
function decoder(brut: string): ChoixConsentement | null {
  let lu: unknown;
  try {
    lu = JSON.parse(decodeURIComponent(brut));
  } catch {
    return null;
  }
  if (typeof lu !== "object" || lu === null) return null;
  const { v, d, c } = lu as Record<string, unknown>;
  if (typeof v !== "string" || v.length === 0 || v.length > 32) return null;
  if (typeof d !== "number" || !Number.isInteger(d) || d <= 0) return null;
  if (typeof c !== "object" || c === null || Array.isArray(c)) return null;
  const reponses: ReponsesConsentement = {};
  for (const id of IDS_CATEGORIES_FACULTATIVES) {
    const reponse = (c as Record<string, unknown>)[id];
    if (reponse === 1) reponses[id] = true;
    else if (reponse === 0) reponses[id] = false;
  }
  return { version: v, date: d * 1000, reponses };
}

/**
 * Le choix gardé dans le cookie « sosmiam-consentement », s'il vaut encore : même version de la liste des partenaires et
 * moins de 6 mois. Sinon null, et le bandeau revient. `enTeteCookie` : l'en-tête Cookie de la requête (serveur) ou
 * document.cookie (navigateur). Si plusieurs cookies portent ce nom (celui de sosmiam.fr et celui d'un aperçu), le plus
 * récent des choix valables l'emporte.
 */
export function lireChoixConsentement(enTeteCookie: string | null | undefined, version: string, maintenant: number): ChoixConsentement | null {
  let retenu: ChoixConsentement | null = null;
  for (const morceau of (enTeteCookie ?? "").split(";")) {
    const texte = morceau.trim();
    if (!texte.startsWith(`${NOM_COOKIE_CONSENTEMENT}=`)) continue;
    const choix = decoder(texte.slice(NOM_COOKIE_CONSENTEMENT.length + 1));
    if (!choix || choix.version !== version || maintenant >= calculerFinConsentement(choix.date)) continue;
    if (!retenu || choix.date > retenu.date) retenu = choix;
  }
  return retenu;
}
