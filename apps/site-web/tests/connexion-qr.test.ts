// Connexion par QR code sur le site : origine, code et QR dessiné, cookie chiffré de 2 minutes, demande du QR et attente
// avec une fausse API (avec et sans JavaScript), session posée une seule fois, page /q, robots et liens universels.
// node --test tests/*.test.ts (dans apps/site-web).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
const { choisirOrigineQr } = await import("../src/fonctions/connexion-qr/choisir-origine-qr.ts");
// @ts-ignore
const { construireLienQr } = await import("../src/fonctions/connexion-qr/construire-lien-qr.ts");
// @ts-ignore
const { dessinerQrSvg } = await import("../src/fonctions/connexion-qr/dessiner-qr-svg.ts");
// @ts-ignore
const { lireCodeQr } = await import("../src/fonctions/connexion-qr/lire-code-qr.ts");
// @ts-ignore
const { lireEtatQr } = await import("../src/fonctions/connexion-qr/lire-etat-qr.ts");
// @ts-ignore
const cookies = await import("../src/services/cookies-connexion-externe.server.ts");
// @ts-ignore
const { demarrerConnexionQr, lireQrAffiche, suivreConnexionQr } = await import("../src/services/connexion-qr.server.ts");
// @ts-ignore
const { CHEMINS_LIENS_APP } = await import("../src/contenus/liens-app.ts");
// @ts-ignore : idem
const { preparerAdresseMesure } = await import("../src/fonctions/mesure/preparer-adresse-mesure.ts");

const MAINTENANT = Date.parse("2026-10-14T10:00:00Z");
const CODE = "abcdefghijkmnpqrstuvwxyz23456789";
const SECRET = "s".repeat(43);
const CHROME_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
/** Les cookies d'une réponse, en en-tête Cookie pour la demande suivante (les cookies effacés n'y sont pas) */
const enCookie = (reponse: Response) => reponse.headers.getSetCookie().filter((ligne) => !/Max-Age=0/.test(ligne)).map((ligne) => ligne.split(";")[0]).join("; ");

type Appel = { quoi: string; args: unknown[] };
/** Une fausse API : `etats` dit ce que rend chaque attente, dans l'ordre */
function fausseApi(etats: { ok: boolean; etat?: string; session?: string; erreur?: string }[] = [], creation: object = { ok: true, code: CODE, secret: SECRET, expireLe: new Date(MAINTENANT + 120_000).toISOString() }) {
  const appels: Appel[] = [];
  return {
    appels,
    dependances: {
      demander: async (...args: unknown[]) => (appels.push({ quoi: "demander", args }), creation),
      attendre: async (...args: unknown[]) => (appels.push({ quoi: "attendre", args }), etats.shift() ?? { ok: true, etat: "attente" }),
      poserSession: async (jeton: string) => `sosmiam-session=${jeton}; Path=/; HttpOnly`,
      maintenant: () => MAINTENANT,
    } as never,
  };
}

/** POST /connexion/qr depuis la page `depart` de `hote`, avec ou sans JavaScript */
function demandeQr(hote: string, depart: string, json: boolean, retour?: string) {
  const corps = new URLSearchParams({ depart, ...(retour ? { retour } : {}) });
  return new Request(`https://${hote}/connexion/qr`, {
    method: "POST", body: corps,
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": CHROME_MAC, "X-Real-IP": "203.0.113.7", ...(json ? { Accept: "application/json" } : {}) },
  });
}
const attente = (hote: string, cookie: string, json = true) =>
  new Request(`https://${hote}/connexion/qr/attente`, { method: json ? "POST" : "GET", headers: { Cookie: cookie, ...(json ? { Accept: "application/json" } : {}) } });

test("petites fonctions : origine par espace, lien et code, états connus, QR en SVG", () => {
  assert.deepEqual((["site", "ambassadeur", "pro"] as const).map((espace) => choisirOrigineQr(espace)), ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]);
  assert.equal(construireLienQr(CODE), `https://sosmiam.fr/q/${CODE}`);
  assert.equal(lireCodeQr(CODE), CODE);
  for (const faux of [CODE.toUpperCase(), `${CODE}a`, "abc", "", null, `${CODE.slice(0, 31)}0`]) assert.equal(lireCodeQr(faux), null);
  assert.equal(lireEtatQr("scanne"), "scanne");
  assert.equal(lireEtatQr("<script>"), null);
  const svg = dessinerQrSvg(construireLienQr(CODE));
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 (\d+) \1"/);
  assert.match(svg, /<path d="M\d+ \d+h1v1h-1z/);
  assert.ok(!svg.includes(SECRET));
});

test("cookie du QR : chiffré, HttpOnly, SameSite=Lax, 2 minutes au plus ; falsifié ou fini : rien", () => {
  const garde = { secret: SECRET, code: CODE, expire: MAINTENANT + 120_000, depart: "/mon-compte", retour: null, espace: "site" } as const;
  const ligne: string = cookies.poserCookieQr(garde, MAINTENANT);
  assert.match(ligne, /HttpOnly/);
  assert.match(ligne, /SameSite=Lax/);
  assert.match(ligne, /Max-Age=120;/);
  assert.ok(!ligne.includes(SECRET) && !ligne.includes(CODE));
  const requete = (valeur: string) => new Request("https://sosmiam.fr/", { headers: { Cookie: valeur } });
  const valeur = ligne.split(";")[0];
  assert.deepEqual(cookies.lireCookieQr(requete(valeur), MAINTENANT), garde);
  assert.equal(cookies.lireCookieQr(requete(valeur), MAINTENANT + 151_000), null, "fini depuis plus de 30 s");
  assert.equal(cookies.lireCookieQr(requete(`${valeur.slice(0, -2)}AA`), MAINTENANT), null);
  // Le cookie d'un autre usage (Apple / Google) ne passe pas pour celui du QR
  const autre = cookies.poserCookieAttente({ expire: MAINTENANT + 1000 } as never, MAINTENANT).split(";")[0].split("=")[1];
  assert.equal(cookies.lireCookieQr(requete(`${cookies.NOM_COOKIE_QR}=${autre}`), MAINTENANT), null);
  assert.match(cookies.effacerCookieQr(), /Max-Age=0/);
});

test("demander un QR (JavaScript) : origine de l'hôte, IP et navigateur transmis ; QR en SVG et cookie du secret", async () => {
  const { appels, dependances } = fausseApi();
  const reponse: Response = await demarrerConnexionQr(demandeQr("pro.sosmiam.fr", "/connexion", true, "/lieu/3"), dependances);
  assert.equal(reponse.status, 200);
  assert.equal(reponse.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(appels[0], { quoi: "demander", args: ["pro.sosmiam.fr", "203.0.113.7", CHROME_MAC] });
  const corps = await reponse.json();
  assert.equal(corps.ok, true);
  assert.match(corps.svg, /^<svg /);
  assert.equal(corps.expireLe, MAINTENANT + 120_000);
  assert.ok(!JSON.stringify(corps).includes(SECRET), "le secret ne va jamais au navigateur");
  const lu = cookies.lireCookieQr(new Request("https://pro.sosmiam.fr/", { headers: { Cookie: enCookie(reponse) } }), MAINTENANT);
  assert.deepEqual(lu, { secret: SECRET, code: CODE, expire: MAINTENANT + 120_000, depart: "/connexion", retour: "/lieu/3", espace: "pro" });
  // sosmiam.fr/mon-compte : origine « sosmiam.fr » ; /connexion d'ambassadeur. : « ambassadeur.sosmiam.fr »
  await demarrerConnexionQr(demandeQr("sosmiam.fr", "/mon-compte", true), dependances);
  await demarrerConnexionQr(demandeQr("ambassadeur.sosmiam.fr", "/connexion", true), dependances);
  assert.deepEqual(appels.slice(1).map((appel) => appel.args[0]), ["sosmiam.fr", "ambassadeur.sosmiam.fr"]);
});

test("demander un QR sans JavaScript : retour à la page, qui redessine le QR ; trop de demandes : message", async () => {
  const { dependances } = fausseApi();
  const reponse: Response = await demarrerConnexionQr(demandeQr("sosmiam.fr", "/mon-compte", false), dependances);
  assert.equal(reponse.status, 303);
  assert.equal(reponse.headers.get("location"), "/mon-compte?qr=attente#connexion-qr");
  const page = new Request("https://sosmiam.fr/mon-compte?qr=attente", { headers: { Cookie: enCookie(reponse) } });
  const affiche = lireQrAffiche(page, MAINTENANT + 1000)!;
  assert.equal(affiche.etat, "attente");
  assert.match(affiche.svg ?? "", /^<svg /);
  assert.equal(lireQrAffiche(new Request("https://sosmiam.fr/mon-compte"), MAINTENANT), null, "pas de QR tant qu'on n'a pas cliqué");
  assert.deepEqual(lireQrAffiche(new Request("https://sosmiam.fr/mon-compte?qr=attente"), MAINTENANT), { svg: null, expireLe: null, etat: "expire" });
  assert.deepEqual(lireQrAffiche(new Request("https://sosmiam.fr/mon-compte?qr=refuse"), MAINTENANT), { svg: null, expireLe: null, etat: "refuse" });
  const trop = fausseApi([], { ok: false, erreur: "trop-de-demandes" });
  const refus: Response = await demarrerConnexionQr(demandeQr("sosmiam.fr", "/mon-compte", true), trop.dependances);
  assert.deepEqual(await refus.json(), { ok: false, etat: "trop" });
  assert.deepEqual(refus.headers.getSetCookie(), []);
});

test("attente : attente, scanné, puis accepté → cookie de session de l'hôte, QR effacé, page de l'espace ; une seule fois", async () => {
  const { appels, dependances } = fausseApi([
    { ok: true, etat: "attente" }, { ok: true, etat: "scanne" }, { ok: true, etat: "accepte", session: "jeton-neuf" }, { ok: true, etat: "expire" },
  ]);
  const depart: Response = await demarrerConnexionQr(demandeQr("pro.sosmiam.fr", "/connexion", true), dependances);
  const cookie = enCookie(depart);
  const lire = async () => {
    const reponse: Response = await suivreConnexionQr(attente("pro.sosmiam.fr", cookie), dependances);
    return { reponse, corps: await reponse.json() };
  };
  assert.deepEqual((await lire()).corps, { ok: true, etat: "attente" });
  assert.deepEqual(appels[1], { quoi: "attendre", args: [SECRET, null] });
  assert.deepEqual((await lire()).corps, { ok: true, etat: "scanne" });
  const fin = await lire();
  assert.deepEqual(fin.corps, { ok: true, etat: "accepte", aller: "/tableau" });
  const poses = fin.reponse.headers.getSetCookie();
  assert.ok(poses.some((ligne) => ligne.startsWith("sosmiam-session=jeton-neuf")));
  assert.ok(poses.some((ligne) => ligne.startsWith(`${cookies.NOM_COOKIE_QR}=;`) && /Max-Age=0/.test(ligne)));
  assert.ok(!JSON.stringify(fin.corps).includes("jeton-neuf"), "le jeton reste dans le cookie HttpOnly");
  assert.deepEqual((await lire()).corps, { ok: true, etat: "expire" });
});

test("attente : refusé ou expiré → cookie du QR effacé ; sans cookie : expiré ; sans JavaScript : redirections", async () => {
  const { dependances } = fausseApi([{ ok: true, etat: "refuse" }, { ok: true, etat: "accepte", session: "jeton-2" }, { ok: true, etat: "scanne" }]);
  const cookie = enCookie(await demarrerConnexionQr(demandeQr("sosmiam.fr", "/mon-compte", true), dependances));
  const refus: Response = await suivreConnexionQr(attente("sosmiam.fr", cookie), dependances);
  assert.deepEqual(await refus.json(), { ok: true, etat: "refuse" });
  assert.ok(refus.headers.getSetCookie().some((ligne) => /Max-Age=0/.test(ligne)));
  const sans: Response = await suivreConnexionQr(attente("sosmiam.fr", ""), dependances);
  assert.deepEqual(await sans.json(), { ok: true, etat: "expire" });
  // « J'ai validé sur mon téléphone » (GET, sans JavaScript) : accepté → la page « Mon compte » ; sinon retour au bloc
  const valide: Response = await suivreConnexionQr(attente("sosmiam.fr", cookie, false), dependances);
  assert.deepEqual([valide.status, valide.headers.get("location")], [303, "/mon-compte"]);
  const encore: Response = await suivreConnexionQr(attente("sosmiam.fr", cookie, false), dependances);
  assert.deepEqual([encore.status, encore.headers.get("location")], [303, "/mon-compte?qr=scanne#connexion-qr"]);
  const vide: Response = await suivreConnexionQr(attente("ambassadeur.sosmiam.fr", "", false), dependances);
  assert.equal(vide.headers.get("location"), "/connexion?qr=expire#connexion-qr");
});

test("page /q, robots et liens universels : /q/* ouvert par l'app, fermé aux moteurs, statistiques sur « /q » seulement", async () => {
  assert.ok(CHEMINS_LIENS_APP.includes("/q/*"));
  // robots.txt (Disallow: /q/) : vérifié par tests/liens-app.test.ts, qui sait résoudre les imports « ~/… »
  const source = (fichier: string) => readFileSync(`${import.meta.dirname}/../src/${fichier}`, "utf-8");
  // Statistiques : ni le code du QR, ni le pseudo d'une invitation, ni leurs paramètres ne partent vers l'API
  for (const adresse of ["/q/Ab3dE5fG7h", "/q/Ab3dE5fG7h.data?_routes=x&utm_source=y", "/Q/code"]) {
    assert.equal(preparerAdresseMesure(`https://sosmiam.fr${adresse}`), "/q", adresse);
  }
  for (const adresse of ["/invitation/lea.miam?c=SECRET", "/invitation/lea.miam.data"]) {
    assert.equal(preparerAdresseMesure(`https://sosmiam.fr${adresse}`), "/invitation", adresse);
  }
  assert.match(source("services/mesure.server.ts"), /adressePage: preparerAdresseMesure\(requete\.url\)/);
  const page = source("routes/public/qr-connexion.tsx");
  assert.match(page, /"X-Robots-Tag": "noindex"/);
  assert.match(page, /"Referrer-Policy": "no-referrer"/);
  assert.match(page, /\$\{SCHEMA_APP\}:\/\/q\/\$\{code\}/);
  assert.ok(!/console\./.test(page) && !/console\./.test(source("services/connexion-qr.server.ts")), "rien n'est journalisé");
});
