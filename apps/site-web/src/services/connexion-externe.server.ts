// « Continuer avec Apple » et « Continuer avec Google » sur le site : OpenID Connect par redirection, réponse en
// form_post, sans script tiers ni secret client. Le départ (GET /connexion/<fournisseur>) et le retour
// (POST /connexion/<fournisseur>/retour, depuis Apple ou Google) ; le jeton est vérifié par l'API (POST /comptes/apple ou
// /comptes/google, support « site »). Jamais de jeton ni d'e-mail dans un journal.
// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import type { CodeConnexionExterne } from "../contenus/connexion-externe.ts";
import { calculerEmpreinteNonce } from "../fonctions/connexion-externe/calculer-empreinte-nonce.ts";
import { choisirAdresseRetourFournisseur } from "../fonctions/connexion-externe/choisir-adresse-retour-fournisseur.ts";
import { choisirCodeConnexionExterne } from "../fonctions/connexion-externe/choisir-code-connexion-externe.ts";
import { choisirEspaceConnexion } from "../fonctions/connexion-externe/choisir-espace-connexion.ts";
import { choisirPageApresConnexion } from "../fonctions/connexion-externe/choisir-page-apres-connexion.ts";
import { construireAdresseFournisseur } from "../fonctions/connexion-externe/construire-adresse-fournisseur.ts";
import { creerEtatConnexion, DUREE_ETAT_CONNEXION } from "../fonctions/connexion-externe/creer-etat-connexion.ts";
import { lireIntentionConnexion } from "../fonctions/connexion-externe/lire-intention-connexion.ts";
import { lirePageDepart } from "../fonctions/connexion-externe/lire-page-depart.ts";
import { lireUtilisateurApple } from "../fonctions/connexion-externe/lire-utilisateur-apple.ts";
import { verifierEtatConnexion } from "../fonctions/connexion-externe/verifier-etat-connexion.ts";
import { lireRetourSur } from "../fonctions/navigation/lire-retour-sur.ts";
import type { AttenteConnexion, FournisseurExterne, PageDepart } from "../types/connexion-externe.ts";
import { effacerCookieEtat, lireCookieEtat, poserCookieAttente, poserCookieConfirmation, poserCookieEtat } from "./cookies-connexion-externe.server.ts";
import { lireReglagesConnexionExterne } from "./reglages-connexion-externe.server.ts";

/** Adresse de « Finir ton inscription » (compte inexistant : date de naissance, ville, conditions) */
export const PAGE_FINIR_INSCRIPTION = "/connexion/finir-inscription";

/** Ce que le retour demande au reste du site : l'appel à l'API et le cookie de session de l'hôte (injectés pour les tests) */
export type DependancesRetour = {
  appeler: (fournisseur: FournisseurExterne, corps: Record<string, unknown>, ip: string | null) => Promise<
    { ok: true; session: string } | { ok: false; erreur: string; prefill?: { email?: string; prenom?: string; nom?: string } }
  >;
  poserSession: (jeton: string) => Promise<string>;
  maintenant?: () => number;
};

export const estFournisseur = (valeur: unknown): valeur is FournisseurExterne => valeur === "apple" || valeur === "google";

/** Une redirection (303 : après le POST d'Apple ou de Google, la page suivante est lue en GET), jamais gardée en cache */
function rediriger(adresse: string, cookies: string[], statut: 302 | 303 = 303): Response {
  const entetes = new Headers({ Location: adresse, "Cache-Control": "private, no-store" });
  for (const cookie of cookies) entetes.append("Set-Cookie", cookie);
  return new Response(null, { status: statut, headers: entetes });
}

/** Retour à la page de départ avec un message aimable */
const versDepart = (depart: PageDepart, code: CodeConnexionExterne, cookies: string[]) => rediriger(`${depart}?externe=${code}`, cookies);

/** Sans cookie de départ lisible : /connexion sur les espaces, « Mon compte » ailleurs (sosmiam.fr n'a pas de /connexion) */
const departParDefaut = (hote: string): PageDepart => (/^(ambassadeur|pro)\./i.test(hote) ? "/connexion" : "/mon-compte");

/**
 * GET /connexion/<fournisseur>?depart=…&retour=…&intention=… : garde un state et un nonce tout neufs dans le cookie de
 * départ (10 minutes), puis envoie chez Apple ou Google. Fournisseur pas réglé : retour à la page de départ.
 */
export function demarrerConnexionExterne(requete: Request, fournisseur: FournisseurExterne, maintenant = Date.now()): Response {
  const url = new URL(requete.url);
  const depart = lirePageDepart(url.searchParams.get("depart") ?? departParDefaut(url.hostname));
  const clientId = lireReglagesConnexionExterne()[fournisseur];
  if (!clientId) return versDepart(depart, "indisponible", []);
  const intention = lireIntentionConnexion(url.searchParams.get("intention"));
  const espace = choisirEspaceConnexion(url.host, depart);
  const retour = lireRetourSur(url.searchParams.get("retour")) ?? choisirPageApresConnexion(espace, depart);
  const etat = creerEtatConnexion({ fournisseur, intention, depart, retour }, maintenant);
  const adresse = construireAdresseFournisseur({
    fournisseur, clientId, adresseRetour: choisirAdresseRetourFournisseur(url, fournisseur), state: etat.state,
    // Apple met dans le jeton le nonce tel qu'il le reçoit : on lui donne le SHA-256, l'API recalcule depuis le nonce brut
    nonceEnvoye: fournisseur === "apple" ? calculerEmpreinteNonce(etat.nonce) : etat.nonce,
  });
  return rediriger(adresse, [poserCookieEtat(etat)], 302);
}

const lireTexte = (formulaire: FormData, nom: string, maximum: number) => {
  const valeur = formulaire.get(nom);
  return typeof valeur === "string" && valeur !== "" && valeur.length <= maximum ? valeur : null;
};

/**
 * POST /connexion/<fournisseur>/retour : vérifie le state (en temps constant) et efface le cookie de départ, puis
 * - suppression, relier, delier : garde le jeton dans le cookie d'attente (sans appeler l'API : ce POST d'un autre site
 *   n'a pas le cookie de session), et « Mon compte » demande la dernière confirmation par un bouton ;
 * - connexion : l'API vérifie le jeton → cookie de session et page demandée ; compte à créer → « Finir ton inscription »
 *   (jeton gardé dans le cookie d'attente) ; sinon retour à la page de départ avec un message.
 */
export async function terminerConnexionExterne(requete: Request, fournisseur: FournisseurExterne, dependances: DependancesRetour): Promise<Response> {
  const maintenant = (dependances.maintenant ?? Date.now)();
  const url = new URL(requete.url);
  const formulaire = await requete.formData().catch(() => null);
  const etat = lireCookieEtat(requete);
  const cookies = [effacerCookieEtat()];
  if (!formulaire || !etat || !verifierEtatConnexion(etat, fournisseur, formulaire.get("state"), maintenant)) {
    return versDepart(etat?.depart ?? departParDefaut(url.hostname), "expire", cookies);
  }
  const { depart, retour, nonce, intention } = etat;
  // Relier ou délier : le message va à « Mes façons de me connecter »
  const mesConnexions = intention === "relier" || intention === "delier" || intention === "confirmer-relier";
  const echec = (code: "annule" | "refuse") =>
    mesConnexions ? rediriger(`${depart}?connexions=${code}&avec=${fournisseur}#mes-connexions`, cookies) : versDepart(depart, code, cookies);
  // Annulé chez Apple (« user_cancelled_authorize ») ou chez Google (« access_denied ») : rien n'a changé
  if (formulaire.get("error") !== null) return echec("annule");
  const jeton = lireTexte(formulaire, "id_token", 8000);
  if (!jeton) return echec("refuse");
  // Apple ne donne le prénom qu'à la toute première connexion, dans « user » (jamais vérifié : seulement pour pré-remplir)
  const utilisateur = fournisseur === "apple" ? lireUtilisateurApple(formulaire.get("user")) : { prenom: null, nom: null };
  const attente = (prefill: { email?: string; prenom?: string; nom?: string } = {}): AttenteConnexion => ({
    fournisseur, intention, jeton, nonce, depart, retour, espace: choisirEspaceConnexion(url.host, depart),
    prenom: prefill.prenom ?? utilisateur.prenom, nom: prefill.nom ?? utilisateur.nom, email: prefill.email ?? null,
    expire: maintenant + DUREE_ETAT_CONNEXION,
  });

  if (intention !== "connexion") {
    const ancre = intention === "suppression" ? "supprimer-mon-compte" : "mes-connexions";
    const garde = intention === "confirmer-relier" ? poserCookieConfirmation(attente(), maintenant) : poserCookieAttente(attente(), maintenant);
    return rediriger(`${depart}#${ancre}`, [...cookies, garde]);
  }
  const corps = {
    [fournisseur === "apple" ? "identityToken" : "idToken"]: jeton, nonce, support: "site",
    ...(utilisateur.prenom ? { prenom: utilisateur.prenom } : {}), ...(utilisateur.nom ? { nom: utilisateur.nom } : {}),
  };
  const reponse = await dependances.appeler(fournisseur, corps, requete.headers.get("x-real-ip"));
  if (reponse.ok) return rediriger(retour, [...cookies, await dependances.poserSession(reponse.session)]);
  if (reponse.erreur === "profil-a-completer") {
    return rediriger(PAGE_FINIR_INSCRIPTION, [...cookies, poserCookieAttente(attente(reponse.prefill), maintenant)]);
  }
  return versDepart(depart, choisirCodeConnexionExterne(reponse.erreur), cookies);
}
