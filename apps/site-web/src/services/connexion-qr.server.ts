// Connexion par QR code sur le site, comme Discord (décidé le 14 octobre 2026) : sous le formulaire de connexion de
// sosmiam.fr/mon-compte et de /connexion (ambassadeur. et pro.), « Me connecter avec l'app » affiche un QR ; l'app SOS
// Miam déjà connectée le scanne et valide (Face ID, empreinte ou code du téléphone : sur le téléphone). Le serveur du site
// demande le QR à l'API (POST /comptes/qr, cible « site »), garde le secret dans un cookie chiffré HttpOnly de 2 minutes, et
// le navigateur interroge toutes les 2 s (POST /connexion/qr/attente) ; à « accepte », le cookie de session de l'hôte est
// posé. Sans JavaScript : le formulaire recharge la page avec le QR, et « J'ai validé sur mon téléphone » revient ici.
// Jamais de code, de secret ni de jeton dans un journal.
// Aucun import « ~/… » ici : les tests (tests/connexion-qr.test.ts) lancent ce fichier directement avec Node.
import { choisirEspaceConnexion } from "../fonctions/connexion-externe/choisir-espace-connexion.ts";
import { choisirPageApresConnexion } from "../fonctions/connexion-externe/choisir-page-apres-connexion.ts";
import { lirePageDepart } from "../fonctions/connexion-externe/lire-page-depart.ts";
import { choisirOrigineQr } from "../fonctions/connexion-qr/choisir-origine-qr.ts";
import { construireLienQr } from "../fonctions/connexion-qr/construire-lien-qr.ts";
import { dessinerQrSvg } from "../fonctions/connexion-qr/dessiner-qr-svg.ts";
import { lireEtatQr } from "../fonctions/connexion-qr/lire-etat-qr.ts";
import { lireRetourSur } from "../fonctions/navigation/lire-retour-sur.ts";
import type { PageDepart } from "../types/connexion-externe.ts";
import type { AttenteQr, EtatQrSite, QrAffiche } from "../types/connexion-qr.ts";
import { effacerCookieQr, lireCookieQr, poserCookieQr } from "./cookies-connexion-externe.server.ts";

type Echec = { ok: false; erreur: string };
/** Ce que la connexion par QR demande au reste du site : les appels à l'API et le cookie de session (injectés pour les tests) */
export type DependancesQr = {
  demander: (origine: string, ip: string | null, signature: string | null) => Promise<{ ok: true; code: string; secret: string; expireLe: string } | Echec>;
  attendre: (secret: string, ip: string | null) => Promise<{ ok: true; etat: string; session?: string } | Echec>;
  poserSession: (jeton: string) => Promise<string>;
  maintenant?: () => number;
};

/** L'ancre du bloc dans la page, pour y revenir sans JavaScript */
export const ANCRE_QR = "connexion-qr";

/** Le navigateur demande du JSON (fetch du bloc) ; sinon c'est une navigation sans JavaScript */
const veutJson = (requete: Request) => (requete.headers.get("Accept") ?? "").includes("application/json");

function repondre(requete: Request, json: object, retourPage: string, cookies: string[]): Response {
  const entetes = new Headers({ "Cache-Control": "private, no-store" });
  for (const cookie of cookies) entetes.append("Set-Cookie", cookie);
  if (veutJson(requete)) {
    entetes.set("Content-Type", "application/json");
    return new Response(JSON.stringify(json), { headers: entetes });
  }
  entetes.set("Location", retourPage);
  return new Response(null, { status: 303, headers: entetes });
}

/** Sans cookie lisible : la page « Mon compte » sur sosmiam.fr, /connexion sur les espaces */
const departParDefaut = (hote: string): PageDepart => (/^(ambassadeur|pro)\./i.test(hote) ? "/connexion" : "/mon-compte");
const versPage = (depart: PageDepart, etat: EtatQrSite) => `${depart}?qr=${etat}#${ANCRE_QR}`;

/**
 * POST /connexion/qr { depart, retour? } : un QR tout neuf. JSON → { ok, svg, expireLe } (ou { ok: false, etat: "trop" |
 * "erreur" }) ; sans JavaScript → retour à la page, qui redessine le QR depuis le cookie.
 */
export async function demarrerConnexionQr(requete: Request, dependances: DependancesQr): Promise<Response> {
  const maintenant = (dependances.maintenant ?? Date.now)();
  const url = new URL(requete.url);
  const formulaire = await requete.formData().catch(() => null);
  const depart = lirePageDepart(formulaire?.get("depart") ?? departParDefaut(url.hostname));
  const retour = lireRetourSur(formulaire?.get("retour"));
  const espace = choisirEspaceConnexion(url.host, depart);
  const reponse = await dependances.demander(choisirOrigineQr(espace), requete.headers.get("x-real-ip"), requete.headers.get("user-agent"));
  if (!reponse.ok) {
    const etat: EtatQrSite = reponse.erreur === "trop-de-demandes" ? "trop" : "erreur";
    return repondre(requete, { ok: false, etat }, versPage(depart, etat), []);
  }
  const expire = Date.parse(reponse.expireLe);
  const attente: AttenteQr = { secret: reponse.secret, code: reponse.code, expire, depart, retour, espace };
  return repondre(requete, { ok: true, svg: dessinerQrSvg(construireLienQr(reponse.code)), expireLe: expire }, versPage(depart, "attente"), [
    poserCookieQr(attente, maintenant),
  ]);
}

/**
 * POST (fetch, toutes les 2 s) ou GET (« J'ai validé sur mon téléphone ») /connexion/qr/attente : demande à l'API où en est
 * le QR du cookie. « accepte » : cookie de session de l'hôte posé, cookie du QR effacé, { etat, aller } (ou la page
 * demandée) ; « refuse » et « expire » effacent le cookie du QR ; « attente » et « scanne » le gardent.
 */
export async function suivreConnexionQr(requete: Request, dependances: DependancesQr): Promise<Response> {
  const maintenant = (dependances.maintenant ?? Date.now)();
  const attente = lireCookieQr(requete, maintenant);
  if (!attente) return repondre(requete, { ok: true, etat: "expire" }, versPage(departParDefaut(new URL(requete.url).hostname), "expire"), [effacerCookieQr()]);
  const reponse = await dependances.attendre(attente.secret, requete.headers.get("x-real-ip"));
  if (!reponse.ok) {
    const etat: EtatQrSite = reponse.erreur === "trop-de-demandes" ? "trop" : "erreur";
    return repondre(requete, { ok: false, etat }, versPage(attente.depart, etat), []);
  }
  const etat = lireEtatQr(reponse.etat) ?? "erreur";
  if (etat === "accepte" && reponse.session) {
    const aller = attente.retour ?? choisirPageApresConnexion(attente.espace, attente.depart);
    return repondre(requete, { ok: true, etat, aller }, aller, [effacerCookieQr(), await dependances.poserSession(reponse.session)]);
  }
  const fini = etat === "refuse" || etat === "expire" || etat === "accepte";
  return repondre(requete, { ok: true, etat: etat === "accepte" ? "expire" : etat }, versPage(attente.depart, etat === "accepte" ? "expire" : etat), fini ? [effacerCookieQr()] : []);
}

/**
 * Pour les pages qui montrent le bloc (sans JavaScript, ou au rechargement) : le QR du cookie redessiné et l'état de
 * « ?qr=… » ; sans « ?qr= », rien (le bloc reste fermé : pas de QR tant qu'on n'a pas cliqué).
 */
export function lireQrAffiche(requete: Request, maintenant = Date.now()): QrAffiche | null {
  const etat = lireEtatQr(new URL(requete.url).searchParams.get("qr"));
  if (!etat || etat === "accepte") return null;
  const attente = lireCookieQr(requete, maintenant);
  const enCours = attente !== null && maintenant < attente.expire && (etat === "attente" || etat === "scanne");
  if (!enCours) return { svg: null, expireLe: null, etat: etat === "attente" || etat === "scanne" ? "expire" : etat };
  return { svg: dessinerQrSvg(construireLienQr(attente.code)), expireLe: attente.expire, etat };
}
