// « Continuer avec Apple / Google » sur le site : adresses du fournisseur, state et nonce, refus d'un state faux ou
// expiré, retour sûr, partage des hôtes, cookies chiffrés, et le retour complet avec une fausse API.
// node --test tests/*.test.ts (dans apps/site-web).
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

// Les réglages sont lus à la demande : on les pose avant (le .env du site ne remplace jamais une variable déjà posée)
process.env.SOS_MIAM_APPLE_SERVICES_ID = "fr.sosmiam.essai";
process.env.SOS_MIAM_GOOGLE_CLIENT_ID_WEB = "client-web.apps.googleusercontent.com";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
const { construireAdresseFournisseur } = await import("../src/fonctions/connexion-externe/construire-adresse-fournisseur.ts");
// @ts-ignore
const { creerEtatConnexion } = await import("../src/fonctions/connexion-externe/creer-etat-connexion.ts");
// @ts-ignore
const { verifierEtatConnexion } = await import("../src/fonctions/connexion-externe/verifier-etat-connexion.ts");
// @ts-ignore
const { choisirAdresseRetourFournisseur } = await import("../src/fonctions/connexion-externe/choisir-adresse-retour-fournisseur.ts");
// @ts-ignore
const { lireUtilisateurApple } = await import("../src/fonctions/connexion-externe/lire-utilisateur-apple.ts");
// @ts-ignore
const { lireMessageConnexionExterne } = await import("../src/fonctions/connexion-externe/lire-message-connexion-externe.ts");
// @ts-ignore
const { construireAdresseDepart } = await import("../src/fonctions/connexion-externe/construire-adresse-depart.ts");
// @ts-ignore
const { lireRetourSur } = await import("../src/fonctions/navigation/lire-retour-sur.ts");
// @ts-ignore
const { choisirRedirectionHote } = await import("../src/fonctions/hotes/choisir-redirection-hote.ts");
// @ts-ignore
const cookies = await import("../src/services/cookies-connexion-externe.server.ts");
// @ts-ignore
const { demarrerConnexionExterne, terminerConnexionExterne } = await import("../src/services/connexion-externe.server.ts");
// @ts-ignore
const { lireReglagesConnexionExterne } = await import("../src/services/reglages-connexion-externe.server.ts");

const MAINTENANT = Date.parse("2026-10-14T10:00:00Z");
const sha256 = (texte: string) => createHash("sha256").update(texte).digest("hex");
/** Les cookies d'une réponse, en en-tête Cookie pour la demande suivante */
const enCookie = (reponse: Response) => reponse.headers.getSetCookie().map((ligne) => ligne.split(";")[0]).join("; ");

test("adresses du fournisseur : Google en id_token + form_post, Apple en « code id_token » + form_post", () => {
  const google = new URL(construireAdresseFournisseur({
    fournisseur: "google", clientId: "web.apps", adresseRetour: "https://sosmiam.fr/connexion/google/retour", state: "s".repeat(43), nonceEnvoye: "n".repeat(43),
  }));
  assert.equal(google.origin + google.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(google.searchParams.get("response_type"), "id_token");
  assert.equal(google.searchParams.get("response_mode"), "form_post");
  assert.equal(google.searchParams.get("scope"), "openid email profile");
  assert.equal(google.searchParams.get("prompt"), "select_account");
  assert.equal(google.searchParams.get("redirect_uri"), "https://sosmiam.fr/connexion/google/retour");
  assert.equal(google.searchParams.get("nonce"), "n".repeat(43));
  const apple = new URL(construireAdresseFournisseur({
    fournisseur: "apple", clientId: "fr.sosmiam.site", adresseRetour: "https://pro.sosmiam.fr/connexion/apple/retour", state: "s", nonceEnvoye: "e",
  }));
  assert.equal(apple.origin + apple.pathname, "https://appleid.apple.com/auth/authorize");
  assert.equal(apple.searchParams.get("response_type"), "code id_token");
  assert.equal(apple.searchParams.get("response_mode"), "form_post");
  assert.equal(apple.searchParams.get("scope"), "name email");
  assert.equal(apple.searchParams.get("client_id"), "fr.sosmiam.site");
});

test("adresse de retour : https sur les trois hôtes (nginx parle en http), l'origine ailleurs", () => {
  for (const hote of ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) {
    assert.equal(choisirAdresseRetourFournisseur(new URL(`http://${hote}/connexion/apple`), "apple"), `https://${hote}/connexion/apple/retour`);
    assert.equal(choisirAdresseRetourFournisseur(new URL(`http://${hote}/connexion/google`), "google"), `https://${hote}/connexion/google/retour`);
  }
  assert.equal(choisirAdresseRetourFournisseur(new URL("http://127.0.0.1:5190/connexion/google"), "google"), "http://127.0.0.1:5190/connexion/google/retour");
});

test("state et nonce : tirés au hasard, 10 minutes ; state faux, expiré, absent ou d'un autre fournisseur refusé", () => {
  const etat = creerEtatConnexion({ fournisseur: "google", intention: "connexion", depart: "/mon-compte", retour: "/mon-compte" }, MAINTENANT);
  const autre = creerEtatConnexion({ fournisseur: "google", intention: "connexion", depart: "/mon-compte", retour: "/mon-compte" }, MAINTENANT);
  assert.match(etat.state, /^[\w-]{43}$/);
  assert.match(etat.nonce, /^[\w-]{43}$/);
  assert.notEqual(etat.state, autre.state);
  assert.notEqual(etat.nonce, etat.state);
  assert.equal(etat.expire, MAINTENANT + 600_000);
  assert.equal(verifierEtatConnexion(etat, "google", etat.state, MAINTENANT + 1000), true);
  assert.equal(verifierEtatConnexion(etat, "google", autre.state, MAINTENANT), false);
  assert.equal(verifierEtatConnexion(etat, "google", `${etat.state}x`, MAINTENANT), false);
  assert.equal(verifierEtatConnexion(etat, "google", "", MAINTENANT), false);
  assert.equal(verifierEtatConnexion(etat, "google", null, MAINTENANT), false);
  assert.equal(verifierEtatConnexion(etat, "apple", etat.state, MAINTENANT), false);
  assert.equal(verifierEtatConnexion(etat, "google", etat.state, MAINTENANT + 600_001), false);
  assert.equal(verifierEtatConnexion(null, "google", etat.state, MAINTENANT), false);
});

test("retour sûr : un chemin du site seulement ; boutons : adresse du départ", () => {
  assert.equal(lireRetourSur("/espace/kit-media"), "/espace/kit-media");
  for (const mauvais of ["//exemple.fr", "https://exemple.fr", "/\\exemple.fr", "espace", "/a?b=c", "/a#b", null, 12]) assert.equal(lireRetourSur(mauvais), null);
  assert.equal(construireAdresseDepart("apple", "/connexion", "/espace/missions"), "/connexion/apple?depart=%2Fconnexion&retour=%2Fespace%2Fmissions");
  assert.equal(construireAdresseDepart("google", "/mon-compte", null, "suppression"), "/connexion/google?depart=%2Fmon-compte&intention=suppression");
});

test("hôtes : départ, retour et « Finir ton inscription » servis sur les trois hôtes, sans redirection", () => {
  for (const hote of ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) {
    for (const chemin of ["/connexion/google/retour", "/connexion/apple/retour", "/connexion/google?depart=%2Fmon-compte", "/connexion/apple", "/connexion/finir-inscription", "/connexion/finir-inscription.data"]) {
      assert.equal(choisirRedirectionHote(hote, chemin), null, `${hote}${chemin}`);
    }
  }
  // /connexion seule reste une page des espaces
  assert.equal(choisirRedirectionHote("sosmiam.fr", "/connexion")?.adresse, "https://ambassadeur.sosmiam.fr/connexion");
});

test("utilisateur d'Apple (donné une seule fois) et messages : jamais un texte venu de l'adresse", () => {
  assert.deepEqual(lireUtilisateurApple('{"name":{"firstName":" Zoé ","lastName":"Martin"},"email":"z@exemple.fr"}'), { prenom: "Zoé", nom: "Martin" });
  assert.deepEqual(lireUtilisateurApple("pas du json"), { prenom: null, nom: null });
  assert.deepEqual(lireUtilisateurApple(null), { prenom: null, nom: null });
  assert.match(lireMessageConnexionExterne("annule") ?? "", /rien n'a bougé/);
  assert.equal(lireMessageConnexionExterne("<script>"), null);
  assert.equal(lireMessageConnexionExterne("toString"), null);
  assert.equal(lireMessageConnexionExterne(null), null);
});

test("réglages : Services ID d'Apple et client Google lus dans l'environnement, jamais host.exp.Exponent", () => {
  assert.deepEqual(lireReglagesConnexionExterne(), { apple: "fr.sosmiam.essai", google: "client-web.apps.googleusercontent.com" });
  process.env.SOS_MIAM_APPLE_SERVICES_ID = "host.exp.Exponent";
  assert.equal(lireReglagesConnexionExterne().apple, null);
  process.env.SOS_MIAM_APPLE_SERVICES_ID = "";
  assert.equal(lireReglagesConnexionExterne().apple, null);
  process.env.SOS_MIAM_APPLE_SERVICES_ID = "fr.sosmiam.essai";
});

test("cookies : chiffrés, HttpOnly, 10 minutes ; une valeur retouchée ne se lit pas", () => {
  const etat = creerEtatConnexion({ fournisseur: "apple", intention: "connexion", depart: "/connexion", retour: "/espace" }, MAINTENANT);
  const ligne = cookies.poserCookieEtat(etat);
  assert.match(ligne, /HttpOnly/);
  assert.match(ligne, /Max-Age=600/);
  assert.ok(!ligne.includes(etat.state) && !ligne.includes(etat.nonce));
  const requete = (cookie: string) => new Request("http://sosmiam.fr/", { headers: { Cookie: cookie } });
  assert.deepEqual(cookies.lireCookieEtat(requete(ligne.split(";")[0])), etat);
  const valeur = ligne.split(";")[0];
  const retouchee = valeur.slice(0, -3) + (valeur.endsWith("A") ? "BBB" : "AAA");
  assert.equal(cookies.lireCookieEtat(requete(retouchee)), null);
  assert.equal(cookies.lireCookieEtat(requete("autre=1")), null);
});

/** Un départ (GET) puis le cookie qu'il pose, pour simuler le retour */
function partir(fournisseur: "apple" | "google", depart = "/mon-compte", hote = "sosmiam.fr") {
  const reponse = demarrerConnexionExterne(new Request(`http://${hote}/connexion/${fournisseur}?depart=${encodeURIComponent(depart)}`), fournisseur, MAINTENANT);
  const adresse = new URL(reponse.headers.get("Location") ?? "", "http://site.local");
  return { reponse, adresse, cookie: enCookie(reponse), state: adresse.searchParams.get("state") ?? "" };
}

test("départ : cookie posé, Apple reçoit le SHA-256 du nonce, adresse de retour de l'hôte", () => {
  const { reponse, adresse, cookie } = partir("apple", "/connexion", "pro.sosmiam.fr");
  assert.equal(reponse.status, 302);
  assert.equal(adresse.searchParams.get("redirect_uri"), "https://pro.sosmiam.fr/connexion/apple/retour");
  assert.equal(adresse.searchParams.get("client_id"), "fr.sosmiam.essai");
  const etat = cookies.lireCookieEtat(new Request("http://pro.sosmiam.fr/", { headers: { Cookie: cookie } }));
  assert.ok(etat);
  assert.equal(adresse.searchParams.get("nonce"), sha256(etat.nonce));
  assert.equal(etat.retour, "/tableau");
  // Sans Services ID : pas de départ, retour à la page des boutons
  process.env.SOS_MIAM_APPLE_SERVICES_ID = "";
  assert.equal(partir("apple").reponse.headers.get("Location"), "/mon-compte?externe=indisponible");
  process.env.SOS_MIAM_APPLE_SERVICES_ID = "fr.sosmiam.essai";
});

/** Le POST d'Apple ou de Google sur l'adresse de retour */
function revenir(fournisseur: "apple" | "google", cookie: string, champs: Record<string, string>, hote = "sosmiam.fr") {
  return new Request(`http://${hote}/connexion/${fournisseur}/retour`, {
    method: "POST", headers: { Cookie: cookie, Origin: fournisseur === "apple" ? "https://appleid.apple.com" : "https://accounts.google.com" },
    body: new URLSearchParams(champs),
  });
}

test("retour : l'API (simulée) reçoit le jeton et le nonce brut ; session posée, page demandée ouverte", async () => {
  const { cookie, state } = partir("google");
  const appels: Record<string, unknown>[] = [];
  const reponse = await terminerConnexionExterne(revenir("google", cookie, { state, id_token: "jeton.google.signe" }), "google", {
    appeler: async (_f: string, corps: Record<string, unknown>) => (appels.push(corps), { ok: true, session: "jeton-de-session" }),
    poserSession: async (jeton: string) => `sosmiam-session=${jeton}; Path=/`,
    maintenant: () => MAINTENANT + 5000,
  });
  assert.equal(reponse.status, 303);
  assert.equal(reponse.headers.get("Location"), "/mon-compte");
  const poses = reponse.headers.getSetCookie();
  assert.ok(poses.some((ligne) => ligne.startsWith("sosmiam-session=jeton-de-session")));
  assert.ok(poses.some((ligne) => ligne.startsWith(`${cookies.NOM_COOKIE_ETAT}=;`) && ligne.includes("Max-Age=0")));
  const etat = cookies.lireCookieEtat(new Request("http://sosmiam.fr/", { headers: { Cookie: cookie } }));
  assert.deepEqual(appels, [{ idToken: "jeton.google.signe", nonce: etat?.nonce, support: "site" }]);
});

test("retour : state faux ou expiré, annulation, jeton refusé → page de départ, sans appeler l'API", async () => {
  const { cookie, state } = partir("google");
  let appels = 0;
  const dependances = (maintenant: number, erreur = "jeton-externe-invalide") => ({
    appeler: async () => (appels++, { ok: false as const, erreur }), poserSession: async () => "", maintenant: () => maintenant,
  });
  const faux = await terminerConnexionExterne(revenir("google", cookie, { state: "un-autre-state", id_token: "j" }), "google", dependances(MAINTENANT));
  assert.equal(faux.headers.get("Location"), "/mon-compte?externe=expire");
  const expire = await terminerConnexionExterne(revenir("google", cookie, { state, id_token: "j" }), "google", dependances(MAINTENANT + 601_000));
  assert.equal(expire.headers.get("Location"), "/mon-compte?externe=expire");
  const sansCookie = await terminerConnexionExterne(revenir("google", "", { state, id_token: "j" }, "pro.sosmiam.fr"), "google", dependances(MAINTENANT));
  assert.equal(sansCookie.headers.get("Location"), "/connexion?externe=expire");
  const annule = await terminerConnexionExterne(revenir("google", cookie, { state, error: "access_denied" }), "google", dependances(MAINTENANT));
  assert.equal(annule.headers.get("Location"), "/mon-compte?externe=annule");
  assert.equal(appels, 0);
  const refuse = await terminerConnexionExterne(revenir("google", cookie, { state, id_token: "j" }), "google", dependances(MAINTENANT));
  assert.equal(refuse.headers.get("Location"), "/mon-compte?externe=refuse");
  const rattache = await terminerConnexionExterne(revenir("google", cookie, { state, id_token: "j" }), "google", dependances(MAINTENANT, "compte-deja-rattache"));
  assert.equal(rattache.headers.get("Location"), "/mon-compte?externe=deja-rattache");
});

test("retour : compte à créer → « Finir ton inscription », jeton gardé chiffré avec le prénom donné par Apple", async () => {
  const { cookie, state } = partir("apple", "/connexion", "ambassadeur.sosmiam.fr");
  const appels: Record<string, unknown>[] = [];
  const reponse = await terminerConnexionExterne(
    revenir("apple", cookie, { state, id_token: "jeton.apple.signe", code: "c", user: '{"name":{"firstName":"Zoé","lastName":"Martin"}}' }, "ambassadeur.sosmiam.fr"),
    "apple",
    {
      appeler: async (_f: string, corps: Record<string, unknown>) => (appels.push(corps), { ok: false, erreur: "profil-a-completer", prefill: { email: "z@privaterelay.appleid.com", prenom: "Zoé" } }),
      poserSession: async () => "", maintenant: () => MAINTENANT,
    },
  );
  assert.equal(reponse.headers.get("Location"), "/connexion/finir-inscription");
  assert.equal(appels[0]?.identityToken, "jeton.apple.signe");
  assert.equal(appels[0]?.prenom, "Zoé");
  const ligne = reponse.headers.getSetCookie().find((l) => l.startsWith(`${cookies.NOM_COOKIE_ATTENTE}=`)) ?? "";
  assert.ok(!ligne.includes("jeton.apple.signe"));
  const attente = cookies.lireCookieAttente(new Request("http://ambassadeur.sosmiam.fr/", { headers: { Cookie: ligne.split(";")[0] } }), MAINTENANT);
  assert.equal(attente?.jeton, "jeton.apple.signe");
  assert.equal(attente?.espace, "ambassadeur");
  assert.equal(attente?.email, "z@privaterelay.appleid.com");
  assert.equal(attente?.retour, "/espace");
  assert.equal(cookies.lireCookieAttente(new Request("http://x/", { headers: { Cookie: ligne.split(";")[0] } }), MAINTENANT + 601_000), null);
});

test("retour : confirmation d'une suppression → jeton gardé, sans appeler l'API, retour à « Mon compte »", async () => {
  const depart = demarrerConnexionExterne(new Request("http://sosmiam.fr/connexion/google?depart=%2Fmon-compte&intention=suppression"), "google", MAINTENANT);
  const state = new URL(depart.headers.get("Location") ?? "").searchParams.get("state") ?? "";
  let appels = 0;
  const reponse = await terminerConnexionExterne(revenir("google", enCookie(depart), { state, id_token: "jeton.frais" }), "google", {
    appeler: async () => (appels++, { ok: true, session: "x" }), poserSession: async () => "", maintenant: () => MAINTENANT,
  });
  assert.equal(appels, 0);
  assert.equal(reponse.headers.get("Location"), "/mon-compte#supprimer-mon-compte");
  const attente = cookies.lireCookieAttente(new Request("http://sosmiam.fr/", { headers: { Cookie: enCookie(reponse) } }), MAINTENANT);
  assert.equal(attente?.intention, "suppression");
});
