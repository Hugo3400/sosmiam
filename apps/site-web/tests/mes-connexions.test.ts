// « Mes façons de me connecter » dans « Mon compte » : intentions « relier » et « delier », adresses des boutons, messages
// (jamais un texte venu de l'adresse), codes des erreurs de l'API, adresse masquée d'Apple, et le retour d'Apple ou de
// Google pour relier ou délier (jeton gardé chiffré, sans appeler l'API). node --test tests/*.test.ts (dans apps/site-web).
import assert from "node:assert/strict";
import { test } from "node:test";

process.env.SOS_MIAM_APPLE_SERVICES_ID = "fr.sosmiam.essai";
process.env.SOS_MIAM_GOOGLE_CLIENT_ID_WEB = "client-web.apps.googleusercontent.com";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
const { lireIntentionConnexion } = await import("../src/fonctions/connexion-externe/lire-intention-connexion.ts");
// @ts-ignore
const { construireAdresseDepart } = await import("../src/fonctions/connexion-externe/construire-adresse-depart.ts");
// @ts-ignore
const { lireMessageMesConnexions } = await import("../src/fonctions/connexion-externe/lire-message-mes-connexions.ts");
// @ts-ignore
const { choisirCodeMesConnexions } = await import("../src/fonctions/connexion-externe/choisir-code-mes-connexions.ts");
// @ts-ignore
// @ts-ignore
const cookies = await import("../src/services/cookies-connexion-externe.server.ts");
// @ts-ignore
const { demarrerConnexionExterne, terminerConnexionExterne } = await import("../src/services/connexion-externe.server.ts");

const MAINTENANT = Date.parse("2026-10-14T10:00:00Z");
const enCookie = (reponse: Response) => reponse.headers.getSetCookie().map((ligne) => ligne.split(";")[0]).join("; ");

test("intentions : connexion, suppression, relier, delier, confirmer-relier ; tout le reste → connexion", () => {
  for (const intention of ["connexion", "suppression", "relier", "delier", "confirmer-relier"]) assert.equal(lireIntentionConnexion(intention), intention);
  for (const autre of [null, "", "RELIER", "fusionner", 42]) assert.equal(lireIntentionConnexion(autre), "connexion");
});

test("adresses des boutons : « Relier » et « Délier » passent par le départ existant, avec leur intention", () => {
  assert.equal(construireAdresseDepart("google", "/mon-compte", null, "relier"), "/connexion/google?depart=%2Fmon-compte&intention=relier");
  assert.equal(construireAdresseDepart("apple", "/espace/mon-compte", null, "delier"), "/connexion/apple?depart=%2Fespace%2Fmon-compte&intention=delier");
  assert.equal(construireAdresseDepart("google", "/mon-compte", null, "confirmer-relier"), "/connexion/google?depart=%2Fmon-compte&intention=confirmer-relier");
  assert.equal(construireAdresseDepart("google", "/connexion"), "/connexion/google?depart=%2Fconnexion", "la connexion ne change pas");
});

test("messages : seulement nos textes, avec le bon fournisseur ; réussite ou explication", () => {
  assert.deepEqual(lireMessageMesConnexions("relie", "google")?.reussite, true);
  assert.match(lireMessageMesConnexions("relie", "google")?.texte ?? "", /avec Google/);
  assert.match(lireMessageMesConnexions("delie", "apple")?.texte ?? "", /Apple ne t'ouvre plus/);
  const ailleurs = lireMessageMesConnexions("identite-deja-reliee", "google");
  assert.equal(ailleurs?.reussite, false);
  assert.match(ailleurs?.texte ?? "", /déjà relié à un autre compte SOS Miam/);
  assert.match(ailleurs?.texte ?? "", /On ne fusionne jamais/);
  // Fournisseur inconnu ou tapé à la main : « Apple ou Google », jamais le texte de l'adresse
  assert.match(lireMessageMesConnexions("refuse", "<script>")?.texte ?? "", /^Apple ou Google n'a pas pu/);
  for (const inconnu of [null, "", "toString", "constructor", "<b>coucou</b>"]) assert.equal(lireMessageMesConnexions(inconnu, "google"), null);
  for (const code of ["relie", "delie", "identite-deja-reliee", "deja-relie", "derniere-connexion", "autre-compte", "refuse", "expire", "annule", "trop-de-demandes", "indisponible"]) {
    assert.ok(!(lireMessageMesConnexions(code, "apple")?.texte ?? "{").includes("{"), `${code} : tout est remplacé`);
  }
});

test("codes des erreurs de l'API → messages aimables", () => {
  const attendus: [string, string][] = [
    ["identite-deja-reliee", "identite-deja-reliee"], ["deja-relie", "deja-relie"], ["derniere-connexion", "derniere-connexion"],
    ["trop-de-demandes", "trop-de-demandes"], ["jeton-externe-invalide", "refuse"], ["champ-invalide", "refuse"],
    ["confirmation-incorrecte", "autre-compte"], ["google-indisponible", "indisponible"], ["verification-indisponible", "indisponible"], ["erreur", "indisponible"],
  ];
  for (const [erreur, code] of attendus) assert.equal(choisirCodeMesConnexions(erreur), code, erreur);
});

/** Départ puis retour d'un fournisseur, avec l'intention donnée */
async function allerRetour(fournisseur: "apple" | "google", intention: string, hote: string, depart: string, champs: Record<string, string> = {}) {
  const requete = new Request(`http://${hote}/connexion/${fournisseur}?depart=${encodeURIComponent(depart)}&intention=${intention}`);
  const parti = demarrerConnexionExterne(requete, fournisseur, MAINTENANT);
  const state = new URL(parti.headers.get("Location") ?? "").searchParams.get("state") ?? "";
  let appels = 0;
  const reponse = await terminerConnexionExterne(
    new Request(`http://${hote}/connexion/${fournisseur}/retour`, {
      method: "POST", headers: { Cookie: enCookie(parti) }, body: new URLSearchParams({ state, id_token: "jeton.frais.signe", ...champs }),
    }),
    fournisseur,
    { appeler: async () => (appels++, { ok: true as const, session: "x" }), poserSession: async () => "session=x", maintenant: () => MAINTENANT + 3000 },
  );
  return { reponse, appels };
}

test("retour « relier » : jeton gardé chiffré, sans appeler l'API ni ouvrir de session, retour à « Mes façons de me connecter »", async () => {
  const { reponse, appels } = await allerRetour("google", "relier", "sosmiam.fr", "/mon-compte");
  assert.equal(appels, 0);
  assert.equal(reponse.status, 303);
  assert.equal(reponse.headers.get("Location"), "/mon-compte#mes-connexions");
  const poses = reponse.headers.getSetCookie();
  assert.ok(!poses.some((ligne) => ligne.startsWith("session=")), "aucune session posée");
  const ligne = poses.find((l) => l.startsWith(`${cookies.NOM_COOKIE_ATTENTE}=`)) ?? "";
  assert.ok(ligne.includes("HttpOnly") && ligne.includes("SameSite=Lax"));
  assert.ok(!ligne.includes("jeton.frais.signe"), "chiffré");
  const attente = cookies.lireCookieAttente(new Request("http://sosmiam.fr/", { headers: { Cookie: ligne.split(";")[0] } }), MAINTENANT);
  assert.deepEqual([attente?.intention, attente?.fournisseur, attente?.jeton], ["relier", "google", "jeton.frais.signe"]);
  assert.equal(cookies.lireCookieAttente(new Request("http://sosmiam.fr/", { headers: { Cookie: ligne.split(";")[0] } }), MAINTENANT + 11 * 60_000), null, "10 minutes au plus");
});

test("retour « relier » et « delier » sur les espaces : ambassadeur (/espace/mon-compte) et pro (/mon-compte)", async () => {
  const ambassadeur = await allerRetour("apple", "relier", "ambassadeur.sosmiam.fr", "/espace/mon-compte", { code: "c" });
  assert.equal(ambassadeur.reponse.headers.get("Location"), "/espace/mon-compte#mes-connexions");
  const pro = await allerRetour("google", "delier", "pro.sosmiam.fr", "/mon-compte");
  assert.equal(pro.reponse.headers.get("Location"), "/mon-compte#mes-connexions");
  const attente = cookies.lireCookieAttente(new Request("http://pro.sosmiam.fr/", { headers: { Cookie: enCookie(pro.reponse) } }), MAINTENANT);
  assert.deepEqual([attente?.intention, attente?.fournisseur], ["delier", "google"]);
  assert.equal(ambassadeur.appels + pro.appels, 0);
});

test("retour « relier » annulé ou sans jeton : message dans « Mes façons de me connecter », rien de gardé", async () => {
  const annule = await allerRetour("google", "relier", "sosmiam.fr", "/mon-compte", { error: "access_denied" });
  assert.equal(annule.reponse.headers.get("Location"), "/mon-compte?connexions=annule&avec=google#mes-connexions");
  assert.ok(!annule.reponse.headers.getSetCookie().some((ligne) => ligne.startsWith(`${cookies.NOM_COOKIE_ATTENTE}=`)));
  const sansJeton = await allerRetour("apple", "delier", "sosmiam.fr", "/mon-compte", { id_token: "" });
  assert.equal(sansJeton.reponse.headers.get("Location"), "/mon-compte?connexions=refuse&avec=apple#mes-connexions");
});

test("retour « confirmer-relier » (compte sans mot de passe) : la clé actuelle attend à part, l'attente de « relier » reste", async () => {
  const { reponse, appels } = await allerRetour("google", "confirmer-relier", "sosmiam.fr", "/mon-compte");
  assert.equal(appels, 0);
  assert.equal(reponse.headers.get("Location"), "/mon-compte#mes-connexions");
  const poses = reponse.headers.getSetCookie();
  assert.ok(!poses.some((ligne) => ligne.startsWith(`${cookies.NOM_COOKIE_ATTENTE}=`)), "l'attente de « relier » n'est pas touchée");
  const ligne = poses.find((l) => l.startsWith(`${cookies.NOM_COOKIE_CONFIRMATION}=`)) ?? "";
  assert.ok(ligne.includes("HttpOnly") && ligne.includes("SameSite=Lax") && !ligne.includes("jeton.frais.signe"));
  const valeur = ligne.split(";")[0].slice(cookies.NOM_COOKIE_CONFIRMATION.length + 1);
  const confirmation = cookies.lireCookieConfirmation(new Request("http://sosmiam.fr/", { headers: { Cookie: ligne.split(";")[0] } }), MAINTENANT);
  assert.deepEqual([confirmation?.intention, confirmation?.fournisseur, confirmation?.jeton], ["confirmer-relier", "google", "jeton.frais.signe"]);
  const deguise = new Request("http://sosmiam.fr/", { headers: { Cookie: `${cookies.NOM_COOKIE_ATTENTE}=${valeur}` } });
  assert.equal(cookies.lireCookieAttente(deguise, MAINTENANT), null, "chiffré pour son seul usage");
  const annule = await allerRetour("google", "confirmer-relier", "sosmiam.fr", "/mon-compte", { error: "access_denied" });
  assert.equal(annule.reponse.headers.get("Location"), "/mon-compte?connexions=annule&avec=google#mes-connexions");
  assert.ok(!annule.reponse.headers.getSetCookie().some((l) => l.startsWith(`${cookies.NOM_COOKIE_CONFIRMATION}=`)));
});
