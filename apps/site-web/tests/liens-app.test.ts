// Liens universels de l'app (/.well-known/apple-app-site-association et assetlinks.json) et page d'invitation
// /invitation/:pseudo : forme du JSON, en-têtes, 404 sans empreinte, pseudo vérifié, noindex. node --test tests/*.test.ts.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const racine = pathToFileURL(`${import.meta.dirname}/../src/`).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (specificateur.startsWith("~/")) return suivant(`${racine}${specificateur.slice(2)}.ts`, contexte);
    return suivant(specificateur, contexte);
  },
});

const { loader: associationApple } = await import("../src/routes/ressources/association-apple.ts");
const { loader: liensAndroid } = await import("../src/routes/ressources/liens-android.ts");
const { loader: robots } = await import("../src/routes/ressources/robots.ts");
const { lireEmpreintesAndroid } = await import("../src/fonctions/liens-app/lire-empreintes-android.ts");
const { repondreLiensAndroid } = await import("../src/fonctions/liens-app/repondre-liens-android.ts");
const { lirePseudoInvitation } = await import("../src/fonctions/liens-app/lire-pseudo-invitation.ts");
const { lireCodeInvitation } = await import("../src/fonctions/liens-app/lire-code-invitation.ts");
const { choisirRedirectionHote } = await import("../src/fonctions/hotes/choisir-redirection-hote.ts");

const AASA = "/.well-known/apple-app-site-association";
const demande = (hote: string, chemin: string) => ({ request: new Request(`https://${hote}${chemin}`) }) as never;
const EMPREINTE = Array.from({ length: 32 }, (_, i) => i.toString(16).padStart(2, "0").toUpperCase()).join(":");
const lire = (fichier: string) => readFileSync(`${import.meta.dirname}/../src/${fichier}`, "utf-8");

test("apple-app-site-association : 200 en application/json sur sosmiam.fr, formats moderne et ancien", async () => {
  const reponse: Response = associationApple(demande("sosmiam.fr", AASA));
  assert.equal(reponse.status, 200);
  assert.equal(reponse.headers.get("content-type"), "application/json");
  assert.equal(reponse.headers.get("location"), null);
  const json = await reponse.json();
  assert.deepEqual(json.applinks.apps, []);
  assert.equal(json.applinks.details.length, 1);
  const [detail] = json.applinks.details;
  assert.deepEqual(detail.appIDs, ["4F7UVS2357.fr.sosmiam.app"]);
  assert.deepEqual(detail.components, [{ "/": "/invitation/*" }, { "/": "/l/*" }, { "/": "/lieux/*" }]);
  assert.equal(detail.appID, "4F7UVS2357.fr.sosmiam.app");
  assert.deepEqual(detail.paths, ["/invitation/*", "/l/*", "/lieux/*"]);
});

test("apple-app-site-association : 404 sur les autres hôtes", () => {
  for (const hote of ["ambassadeur.sosmiam.fr", "pro.sosmiam.fr", "apercu.sosmiam.fr", "127.0.0.1"]) {
    assert.equal(associationApple(demande(hote, AASA)).status, 404, hote);
  }
});

test("/.well-known/ n'est jamais redirigé, sur aucun hôte ; robots.txt ne le ferme pas", async () => {
  for (const hote of ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) {
    assert.equal(choisirRedirectionHote(hote, AASA), null, hote);
    assert.equal(choisirRedirectionHote(hote, "/.well-known/assetlinks.json"), null, hote);
  }
  const texte = await (await robots(demande("sosmiam.fr", "/robots.txt"))).text();
  assert.doesNotMatch(texte, /well-known/);
  assert.match(texte, /^Allow: \/$/m);
});

test("assetlinks.json : 404 tant que l'empreinte est vide, puis le JSON d'Android", async () => {
  delete process.env.SOS_MIAM_ANDROID_SHA256;
  process.env.SOS_MIAM_ANDROID_SHA256 = "";
  assert.equal(liensAndroid(demande("sosmiam.fr", "/.well-known/assetlinks.json")).status, 404);
  process.env.SOS_MIAM_ANDROID_SHA256 = "pas une empreinte";
  assert.equal(liensAndroid(demande("sosmiam.fr", "/.well-known/assetlinks.json")).status, 404);
  process.env.SOS_MIAM_ANDROID_SHA256 = EMPREINTE.toLowerCase();
  const reponse: Response = liensAndroid(demande("sosmiam.fr", "/.well-known/assetlinks.json"));
  assert.equal(reponse.status, 200);
  assert.equal(reponse.headers.get("content-type"), "application/json");
  assert.deepEqual(await reponse.json(), [{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: { namespace: "android_app", package_name: "fr.sosmiam.app", sha256_cert_fingerprints: [EMPREINTE] },
  }]);
  assert.equal(liensAndroid(demande("pro.sosmiam.fr", "/.well-known/assetlinks.json")).status, 404);
  process.env.SOS_MIAM_ANDROID_SHA256 = "";
});

test("lireEmpreintesAndroid : « AB:CD:… » ou 64 hexadécimaux, plusieurs séparées par des virgules, le reste écarté", () => {
  assert.deepEqual(lireEmpreintesAndroid(undefined), []);
  assert.deepEqual(lireEmpreintesAndroid(" "), []);
  assert.deepEqual(lireEmpreintesAndroid(EMPREINTE.replace(/:/g, "")), [EMPREINTE]);
  assert.deepEqual(lireEmpreintesAndroid(`${EMPREINTE}, AB:CD, ${EMPREINTE}`), [EMPREINTE]);
  assert.equal(repondreLiensAndroid(new Request("https://sosmiam.fr/.well-known/assetlinks.json"), []).status, 404);
});

test("pseudo de l'invitation : même règle que l'API (estPseudoValide), « @ » et majuscules tolérés", () => {
  assert.equal(lirePseudoInvitation("lea.croque"), "lea.croque");
  assert.equal(lirePseudoInvitation("@Lea_Croque"), "lea_croque");
  for (const faux of [undefined, "", "ab", "a".repeat(21), ".lea", "lea.", "le..a", "le__a", "léa", "lea croque", "<script>"]) {
    assert.equal(lirePseudoInvitation(faux), null, String(faux));
  }
});

test("code de l'invitation : lu dans le fragment, ou l'ancien ?c=, côté navigateur seulement", () => {
  assert.equal(lireCodeInvitation("#c=k7mq2x9pa4vt", ""), "k7mq2x9pa4vt");
  assert.equal(lireCodeInvitation("", "?c=K7MQ2X9PA4VT&utm_source=x"), "k7mq2x9pa4vt");
  assert.equal(lireCodeInvitation("", ""), null);
  assert.equal(lireCodeInvitation("#c=a b", "?c=<x>"), null);
  // Le serveur ne lit jamais le code : la page ne le touche que dans le navigateur
  const page = lire("routes/public/invitation.tsx");
  const serveur = page.slice(page.indexOf("export function loader"), page.indexOf("export function headers"));
  assert.doesNotMatch(serveur, /request|searchParams|lireCodeInvitation/);
});

test("page d'invitation : noindex (balise et en-tête), sans Referer, sans og:url, fermée dans robots.txt", async () => {
  const page = lire("routes/public/invitation.tsx");
  assert.match(page, /"X-Robots-Tag": "noindex"/);
  assert.match(page, /"Referrer-Policy": "no-referrer"/);
  assert.match(page, /name: "robots", content: "noindex, nofollow"/);
  assert.doesNotMatch(page, /og:url|og:image/);
  assert.match(page, /sosmiam|SCHEMA_APP/);
  assert.match(lire("routes.ts"), /route\("invitation\/:pseudo", "routes\/public\/invitation\.tsx"\)/);
  const texte = await (await robots(demande("sosmiam.fr", "/robots.txt"))).text();
  assert.match(texte, /^Disallow: \/invitation\/$/m);
  assert.equal(choisirRedirectionHote("sosmiam.fr", "/invitation/lea.croque"), null);
});
