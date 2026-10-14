// Les deux cookies courts de « Continuer avec Apple / Google », chiffrés (AES-256-GCM) avec une clé tirée au démarrage du
// serveur et jamais écrite nulle part : illisibles et infalsifiables pour le navigateur, HttpOnly, 10 minutes au plus.
// Un redémarrage du site les rend caducs : il suffit de recommencer. Strictement nécessaires (page Cookies).
// - le départ (state, nonce, page de départ) : SameSite=None, car Apple et Google reviennent par un POST d'un autre site ;
// - l'attente (jeton vérifié pas encore utilisé : « Finir ton inscription », ou confirmation d'une suppression) : SameSite=Lax.
// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import type { AttenteConnexion, EtatConnexion } from "../types/connexion-externe.ts";

const enProduction = process.env.NODE_ENV === "production";
const CLE = randomBytes(32);
/** En ligne : préfixe __Host- (Secure, sans domaine, chemin « / ») ; en développement (http), sans préfixe ni Secure */
const prefixe = enProduction ? "__Host-" : "";
export const NOM_COOKIE_ETAT = `${prefixe}sosmiam-connexion-externe`;
export const NOM_COOKIE_ATTENTE = `${prefixe}sosmiam-inscription-externe`;
const DUREE = 600;

function chiffrer(objet: unknown, usage: string): string {
  const iv = randomBytes(12);
  const chiffreur = createCipheriv("aes-256-gcm", CLE, iv);
  chiffreur.setAAD(Buffer.from(usage));
  const contenu = Buffer.concat([chiffreur.update(JSON.stringify(objet), "utf8"), chiffreur.final()]);
  return Buffer.concat([iv, chiffreur.getAuthTag(), contenu]).toString("base64url");
}

function dechiffrer(texte: string | null, usage: string): unknown {
  if (!texte || !/^[\w-]{40,6000}$/.test(texte)) return null;
  try {
    const tampon = Buffer.from(texte, "base64url");
    const dechiffreur = createDecipheriv("aes-256-gcm", CLE, tampon.subarray(0, 12));
    dechiffreur.setAAD(Buffer.from(usage));
    dechiffreur.setAuthTag(tampon.subarray(12, 28));
    return JSON.parse(Buffer.concat([dechiffreur.update(tampon.subarray(28)), dechiffreur.final()]).toString("utf8"));
  } catch {
    return null;
  }
}

/** La valeur d'un cookie de la requête, ou null */
function lireCookie(requete: Request, nom: string): string | null {
  for (const morceau of (requete.headers.get("Cookie") ?? "").split(";")) {
    const egal = morceau.indexOf("=");
    if (egal > 0 && morceau.slice(0, egal).trim() === nom) return morceau.slice(egal + 1).trim();
  }
  return null;
}

function ecrireCookie(nom: string, valeur: string, sameSite: "None" | "Lax", duree: number): string {
  // SameSite=None exige Secure : en développement (http), Lax (le retour d'Apple ou de Google n'y arrive de toute façon pas)
  const site = enProduction ? sameSite : "Lax";
  return `${nom}=${valeur}; Path=/; Max-Age=${duree}; HttpOnly; SameSite=${site}${enProduction ? "; Secure" : ""}`;
}

/** Set-Cookie du départ (10 minutes) */
export const poserCookieEtat = (etat: EtatConnexion) => ecrireCookie(NOM_COOKIE_ETAT, chiffrer(etat, "etat"), "None", DUREE);
export const effacerCookieEtat = () => ecrireCookie(NOM_COOKIE_ETAT, "", "None", 0);

/** Le départ gardé (ou null : absent, illisible, d'avant un redémarrage) ; son expiration est vérifiée par verifierEtatConnexion */
export function lireCookieEtat(requete: Request): EtatConnexion | null {
  const lu = dechiffrer(lireCookie(requete, NOM_COOKIE_ETAT), "etat");
  return typeof lu === "object" && lu !== null ? (lu as EtatConnexion) : null;
}

/** Set-Cookie de l'attente (au plus jusqu'à son expiration) */
export function poserCookieAttente(attente: AttenteConnexion, maintenant: number): string {
  return ecrireCookie(NOM_COOKIE_ATTENTE, chiffrer(attente, "attente"), "Lax", Math.max(1, Math.ceil((attente.expire - maintenant) / 1000)));
}
export const effacerCookieAttente = () => ecrireCookie(NOM_COOKIE_ATTENTE, "", "Lax", 0);

/** L'attente en cours (null : absente, illisible ou expirée) */
export function lireCookieAttente(requete: Request, maintenant: number): AttenteConnexion | null {
  const lu = dechiffrer(lireCookie(requete, NOM_COOKIE_ATTENTE), "attente");
  if (typeof lu !== "object" || lu === null) return null;
  const attente = lu as AttenteConnexion;
  return typeof attente.expire === "number" && maintenant <= attente.expire ? attente : null;
}
