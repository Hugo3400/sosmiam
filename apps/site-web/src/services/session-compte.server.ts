import { createCookie, data, redirect } from "react-router";

import { lireSession, type ErreurCompte } from "~/services/comptes.server";
import type { CompteConnecte } from "~/types/compte";

const enProduction = process.env.NODE_ENV === "production";

/** Durée de vie maximale du cookie ; l'API ferme aussi la session après 30 jours sans visite, et au plus après 90 jours. */
const DUREE_SESSION = 90 * 24 * 3600;

/**
 * Cookie de session de l'espace ambassadeur. Il ne contient que le jeton (opaque), lu seulement par le serveur du site :
 * HttpOnly, SameSite=Lax, et en ligne préfixe __Host- (sécurisé, sans domaine, donc jamais envoyé à sosmiam.fr ni à un
 * autre sous-domaine). Strictement nécessaire pour rester connecté : pas de consentement à demander (page Cookies).
 * Sur le serveur de développement (http), il n'est pas « Secure », sinon le navigateur le refuserait.
 */
export const cookieSession = createCookie(enProduction ? "__Host-sosmiam-session" : "sosmiam-session", {
  httpOnly: true,
  secure: enProduction,
  sameSite: "lax",
  path: "/",
  maxAge: DUREE_SESSION,
});

/** IP du visiteur, posée par nginx (sert seulement à limiter les essais côté API). */
export function lireIpVisiteur(requete: Request): string | null {
  return requete.headers.get("x-real-ip");
}

/** Le jeton de session du cookie, ou null. */
export async function lireJetonSession(requete: Request): Promise<string | null> {
  const valeur: unknown = await cookieSession.parse(requete.headers.get("Cookie"));
  return typeof valeur === "string" && valeur.length >= 32 ? valeur : null;
}

/** En-tête Set-Cookie qui garde le jeton après une connexion ou une inscription. */
export function poserCookieSession(jeton: string): Promise<string> {
  return cookieSession.serialize(jeton);
}

/** En-tête Set-Cookie qui efface le cookie (déconnexion, session expirée, compte supprimé). */
export function effacerCookieSession(): Promise<string> {
  return cookieSession.serialize("", { maxAge: 0 });
}

/**
 * Ce que dit l'API du cookie de la requête. « indisponible » : l'API ne répond pas, ou trop de demandes d'affilée ;
 * on ne déconnecte personne pour si peu.
 */
type EtatSession = { etat: "connecte"; jeton: string; compte: CompteConnecte } | { etat: "anonyme" } | { etat: "indisponible" };

// Une seule lecture par requête : le cadre de l'espace et la page demandent tous les deux qui est connecté. React Router
// donne le même objet Request aux loaders d'une requête, et un nouveau après une action : rien de périmé n'est relu.
const lectures = new WeakMap<Request, Promise<EtatSession>>();

function lireEtatSession(requete: Request): Promise<EtatSession> {
  const dejaLue = lectures.get(requete);
  if (dejaLue) return dejaLue;
  const lecture = (async (): Promise<EtatSession> => {
    const jeton = await lireJetonSession(requete);
    if (!jeton) return { etat: "anonyme" };
    const reponse = await lireSession(jeton, lireIpVisiteur(requete));
    if (reponse.ok) return { etat: "connecte", jeton, compte: reponse.compte };
    return reponse.erreur === "session-expiree" ? { etat: "anonyme" } : { etat: "indisponible" };
  })();
  lectures.set(requete, lecture);
  return lecture;
}

/** La personne connectée et son jeton, ou null (pas de cookie, session expirée, ou API injoignable). */
export async function lireCompteConnecte(requete: Request): Promise<{ jeton: string; compte: CompteConnecte } | null> {
  const session = await lireEtatSession(requete);
  return session.etat === "connecte" ? { jeton: session.jeton, compte: session.compte } : null;
}

/** Adresse de retour sûre après la connexion : un chemin du site, jamais une autre adresse (« //exemple.fr »). */
export function lireRetourSur(valeur: unknown): string | null {
  return typeof valeur === "string" && /^\/(?!\/)[\w\-/]*$/.test(valeur) ? valeur : null;
}

/** Retour à /connexion (puis à la page demandée), en effaçant un cookie périmé. */
async function renvoyerVersConnexion(requete: Request): Promise<never> {
  const { pathname } = new URL(requete.url);
  const retour = lireRetourSur(pathname.replace(/\.data$/, ""));
  const cible = retour && retour !== "/espace" ? `/connexion?retour=${encodeURIComponent(retour)}` : "/connexion";
  throw redirect(cible, { headers: { "Set-Cookie": await effacerCookieSession() } });
}

/**
 * Pour les loaders et actions des pages connectées : renvoie la personne connectée, sinon redirige vers /connexion
 * (en revenant ensuite à la page demandée) et efface un cookie périmé. Si l'API ne répond pas, la page d'erreur invite à
 * réessayer, sans déconnecter.
 */
export async function exigerCompte(requete: Request): Promise<{ jeton: string; compte: CompteConnecte }> {
  const session = await lireEtatSession(requete);
  if (session.etat === "connecte") return { jeton: session.jeton, compte: session.compte };
  if (session.etat === "indisponible") throw data("Espace ambassadeur momentanément indisponible", { status: 503 });
  return renvoyerVersConnexion(requete);
}

/** Comme exigerCompte, et en plus ambassadeur validé par l'équipe ; sinon retour à /espace, qui explique le statut. */
export async function exigerAmbassadeurActif(requete: Request): Promise<{ jeton: string; compte: CompteConnecte }> {
  const connecte = await exigerCompte(requete);
  if (connecte.compte.ambassadeur?.statut !== "actif") throw redirect("/espace");
  return connecte;
}

/**
 * Après un appel connecté refusé : session fermée entre-temps (autre appareil, mot de passe changé…) → /connexion ;
 * ambassadeur plus validé → /espace. Les autres erreurs sont laissées à la page.
 */
export async function redirigerSiSessionFermee(requete: Request, erreur: ErreurCompte): Promise<void> {
  if (erreur === "session-expiree") await renvoyerVersConnexion(requete);
  if (erreur === "ambassadeur-non-actif") throw redirect("/espace");
}
