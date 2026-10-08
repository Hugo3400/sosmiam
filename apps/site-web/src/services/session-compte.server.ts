import { createCookie, redirect } from "react-router";

import { lireSession } from "~/services/comptes.server";
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

/** La personne connectée et son jeton, ou null (pas de cookie, session expirée, ou API injoignable). */
export async function lireCompteConnecte(requete: Request): Promise<{ jeton: string; compte: CompteConnecte } | null> {
  const jeton = await lireJetonSession(requete);
  if (!jeton) return null;
  const reponse = await lireSession(jeton, lireIpVisiteur(requete));
  return reponse.ok ? { jeton, compte: reponse.compte } : null;
}

/** Adresse de retour sûre après la connexion : un chemin du site, jamais une autre adresse (« //exemple.fr »). */
export function lireRetourSur(valeur: unknown): string | null {
  return typeof valeur === "string" && /^\/(?!\/)[\w\-/]*$/.test(valeur) ? valeur : null;
}

/**
 * Pour les loaders et actions des pages connectées : renvoie la personne connectée, sinon redirige vers /connexion
 * (en revenant ensuite à la page demandée) et efface un cookie périmé.
 */
export async function exigerCompte(requete: Request): Promise<{ jeton: string; compte: CompteConnecte }> {
  const connecte = await lireCompteConnecte(requete);
  if (connecte) return connecte;
  const { pathname } = new URL(requete.url);
  const retour = lireRetourSur(pathname.replace(/\.data$/, ""));
  const cible = retour && retour !== "/espace" ? `/connexion?retour=${encodeURIComponent(retour)}` : "/connexion";
  throw redirect(cible, { headers: { "Set-Cookie": await effacerCookieSession() } });
}

/** Comme exigerCompte, et en plus ambassadeur validé par l'équipe ; sinon retour à /espace, qui explique le statut. */
export async function exigerAmbassadeurActif(requete: Request): Promise<{ jeton: string; compte: CompteConnecte }> {
  const connecte = await exigerCompte(requete);
  if (connecte.compte.ambassadeur?.statut !== "actif") throw redirect("/espace");
  return connecte;
}
