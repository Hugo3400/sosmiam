import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createServer, type IncomingHttpHeaders } from "node:http";
import { registerHooks } from "node:module";
import type { AddressInfo } from "node:net";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

import { listerThemesDuJour } from "../../../packages/commun/src/fonctions/themes-saison/lister-themes-du-jour.ts";
import { preparerThemeSaisonApi } from "../../../packages/commun/src/fonctions/themes-saison/preparer-theme-saison-api.ts";
import { TENUES_CAPITAINE } from "../../../packages/commun/src/regles/themes-saison.ts";

const dossierSrc = `${import.meta.dirname}/../src/`;
const racine = pathToFileURL(dossierSrc).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (!specificateur.startsWith("~/")) return suivant(specificateur, contexte);
    const chemin = specificateur.slice(2);
    return suivant(`${racine}${chemin}${existsSync(`${dossierSrc}${chemin}.tsx`) ? ".tsx" : ".ts"}`, contexte);
  },
  load(adresse, contexte, suivant) {
    if (!adresse.endsWith(".tsx")) return suivant(adresse, contexte);
    const { outputText } = ts.transpileModule(readFileSync(fileURLToPath(adresse), "utf8"), {
      fileName: fileURLToPath(adresse),
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    return { format: "module", source: outputText, shortCircuit: true };
  },
});

const theme = (jour: string, rang = 0) => preparerThemeSaisonApi(listerThemesDuJour(jour)[rang], "fr");
const VINGT_CINQ_OCTOBRE = Date.parse("2026-10-25T10:00:00Z");
const PREMIER_MARS = Date.parse("2027-03-01T10:00:00Z");

let reponseThemes: { statut: number; corps: unknown } = { statut: 404, corps: { ok: false, erreur: "introuvable" } };
const appels: { chemin: string; entetes: IncomingHttpHeaders }[] = [];
const serveur = createServer((requete, reponse) => {
  const chemin = requete.url ?? "";
  appels.push({ chemin, entetes: requete.headers });
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  if (chemin === "/app/themes") return repondre(reponseThemes.statut, reponseThemes.corps);
  if (chemin === "/lieux/villes") return repondre(200, { ok: true, villes: [{ ville: "Montpellier", nombre: 3 }] });
  if (chemin === "/lieux/accueil" || chemin === "/lieux") return repondre(200, { ok: true, lieux: [] });
  repondre(404, { ok: false, erreur: "introuvable" });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => {
  serveur.closeAllConnections();
  serveur.close();
});
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

beforeEach(() => {
  reponseThemes = { statut: 404, corps: { ok: false, erreur: "introuvable" } };
  appels.length = 0;
});

const repondreThemes = (themes: unknown[]) => {
  reponseThemes = { statut: 200, corps: { ok: true, jour: "2026-11-15", themes } };
};

const { lireThemeSaisonApi } = await import("../src/fonctions/themes-saison/lire-theme-saison-api.ts");
const { calculerThemeSaisonLocal } = await import("../src/fonctions/themes-saison/calculer-theme-saison-local.ts");
const { lireThemeSaisonAccueil } = await import("../src/services/themes-saison.server.ts");

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, StaticRouterProvider, useLoaderData } = await import("react-router");
const accueil = await import("../src/routes/public/accueil.tsx");

const handler = createStaticHandler([
  { id: "accueil", path: "/", loader: accueil.loader as never, Component: () => h(accueil.default as never, { loaderData: useLoaderData(), params: {}, matches: [] } as never) },
]);

async function servirAccueil() {
  const contexte = await handler.query(new Request("https://sosmiam.fr/", { headers: { "x-real-ip": "203.0.113.9" } }));
  assert.ok(!(contexte instanceof Response));
  assert.equal(contexte.statusCode, 200);
  const html = renderToString(h(StaticRouterProvider, { router: createStaticRouter(handler.dataRoutes, contexte), context: contexte, hydrate: false }));
  return html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

test("le 25 octobre 2026 : Halloween en premier, Octobre rose en second", () => {
  assert.deepEqual(listerThemesDuJour("2026-10-25").map(({ theme }) => theme.id), ["halloween", "octobre-rose"]);
  const local = calculerThemeSaisonLocal(VINGT_CINQ_OCTOBRE, "fr");
  assert.equal(local?.id, "halloween");
  assert.equal(local?.tenue, "halloween");
  assert.equal(local?.sobre, false);
  assert.equal(local?.textes.titre, "Des bonbons ou un burger ?");
  assert.deepEqual(local?.couleurs, { fond: "#1E1A2B", texte: "#FFFFFF", accent: "#F28C28", surAccent: "#1A1A1A" });
});

test("calcul local : le jour de Paris compte, et rien un jour sans thème", () => {
  assert.equal(calculerThemeSaisonLocal(Date.parse("2026-10-23T21:30:00Z"), "fr")?.id, "octobre-rose");
  assert.equal(calculerThemeSaisonLocal(Date.parse("2026-10-23T22:30:00Z"), "fr")?.id, "halloween");
  assert.equal(calculerThemeSaisonLocal(PREMIER_MARS, "fr"), null);
});

test("lireThemeSaisonApi : un thème complet passe, une tenue, une couleur ou un texte douteux non", () => {
  const halloween = theme("2026-10-25");
  assert.deepEqual(lireThemeSaisonApi(JSON.parse(JSON.stringify(halloween))), halloween);
  const { couleursSombres: _, ...sansSombres } = halloween;
  assert.deepEqual(lireThemeSaisonApi(sansSombres)?.couleursSombres, halloween.couleurs);
  for (const abime of [
    null,
    [],
    { ...halloween, id: "black-friday" },
    { ...halloween, tenue: "../../secret" },
    { ...halloween, famille: "pub" },
    { ...halloween, couleurs: { ...halloween.couleurs, fond: "red; background:url(x)" } },
    { ...halloween, textes: { ...halloween.textes, titre: "" } },
    { ...halloween, textes: { ...halloween.textes, bouton: 3 } },
    { ...halloween, debut: "demain" },
  ]) {
    assert.equal(lireThemeSaisonApi(abime), null, JSON.stringify(abime)?.slice(0, 80));
  }
  const octobreRose = theme("2026-10-10");
  assert.equal(octobreRose.lienInfo?.langue, "fr");
  assert.deepEqual(lireThemeSaisonApi(JSON.parse(JSON.stringify(octobreRose))), octobreRose);
  for (const lienInfo of [
    { adresse: "javascript:alert(1)", langue: "fr" },
    { adresse: "http://www.cancer.fr/", langue: "fr" },
    { adresse: "https://moi:secret@exemple.fr/", langue: "fr" },
    { adresse: "pas une adresse", langue: "fr" },
    { adresse: "https://www.cancer.fr/", langue: "de" },
    "https://www.cancer.fr/",
  ]) {
    assert.equal(lireThemeSaisonApi({ ...octobreRose, lienInfo })?.lienInfo, null, JSON.stringify(lienInfo));
  }
  assert.ok(TENUES_CAPITAINE.every((tenue) => existsSync(`${import.meta.dirname}/../public/images/tenues-capitaine/${tenue}.svg`)));
});

test("lireThemeSaisonAccueil : le thème de l'API passe avant le calcul local, en français et avec l'IP du visiteur", async () => {
  repondreThemes([theme("2026-11-15")]);
  const lu = await lireThemeSaisonAccueil("203.0.113.9", () => VINGT_CINQ_OCTOBRE);
  assert.equal(lu?.id, "movember");
  assert.equal(appels.length, 1);
  assert.equal(appels[0].chemin, "/app/themes");
  assert.equal(appels[0].entetes["x-langue"], "fr");
  assert.equal(appels[0].entetes["x-ip-visiteur"], "203.0.113.9");
});

test("lireThemeSaisonAccueil : le premier thème de l'API, et aucun quand l'API n'en a pas", async () => {
  repondreThemes([theme("2026-10-25"), theme("2026-10-25", 1)]);
  assert.equal((await lireThemeSaisonAccueil(null, () => PREMIER_MARS))?.id, "halloween");
  assert.equal(appels[0].entetes["x-ip-visiteur"], undefined);
  repondreThemes([]);
  assert.equal(await lireThemeSaisonAccueil(null, () => VINGT_CINQ_OCTOBRE), null);
});

test("lireThemeSaisonAccueil : calcul local si l'API n'a pas la route, tombe ou répond de travers", async () => {
  for (const reponse of [
    { statut: 404, corps: { ok: false, erreur: "introuvable" } },
    { statut: 500, corps: { ok: false } },
    { statut: 429, corps: { ok: false } },
    { statut: 200, corps: { ok: true } },
    { statut: 200, corps: { ok: true, themes: [{ id: "halloween" }] } },
  ]) {
    reponseThemes = reponse;
    assert.equal((await lireThemeSaisonAccueil(null, () => VINGT_CINQ_OCTOBRE))?.id, "halloween", JSON.stringify(reponse));
    assert.equal(await lireThemeSaisonAccueil(null, () => PREMIER_MARS), null, JSON.stringify(reponse));
  }
});

test("accueil : le bandeau en haut, aux couleurs claires du thème, avec le Capitaine habillé et le bouton vers /lieux", async () => {
  repondreThemes([theme("2026-10-25")]);
  const html = await servirAccueil();
  const bandeau = html.slice(html.indexOf('<section aria-labelledby="theme-saison-halloween"'), html.indexOf("</section>") + 10);
  assert.ok(bandeau.length > 10);
  assert.ok(html.indexOf("theme-saison-halloween") < html.indexOf("<h1"));
  assert.match(bandeau, /background-color:#1E1A2B;color:#FFFFFF/);
  assert.match(bandeau, /Halloween · 31 octobre/);
  assert.match(bandeau, /<h2 id="theme-saison-halloween"[^>]*>Des bonbons ou un burger \?<\/h2>/);
  assert.match(bandeau, /<a (?=[^>]*href="\/lieux")(?=[^>]*style="background-color:#F28C28;color:#1A1A1A;border-color:#FFFFFF)[^>]*>Voir la sélection<\/a>/);
  assert.match(bandeau, /<img src="\/images\/tenues-capitaine\/halloween\.svg" alt="Le Capitaine Bouiboui avec des chauves-souris et une citrouille" width="300" height="330"/);
});

test("accueil : un thème sobre a le bandeau seul, et aucun bandeau sans thème", async () => {
  repondreThemes([theme("2026-10-10")]);
  const sobre = await servirAccueil();
  assert.equal(sobre.match(/theme-saison-/g)?.length, 2);
  assert.match(sobre, /La Brigade se met en rose/);
  assert.match(sobre, /background-color:#FCE4EE;color:#1A1A1A/);
  assert.match(sobre, /<a (?=[^>]*href="https:\/\/www\.cancer\.fr\/[^"]*depistage-du-cancer-du-sein")(?=[^>]*hrefLang="fr")(?=[^>]*target="_blank")(?=[^>]*rel="noopener noreferrer")[^>]*>S'informer<\/a>/);
  repondreThemes([]);
  const sans = await servirAccueil();
  assert.doesNotMatch(sans, /theme-saison-|tenues-capitaine/);
  assert.match(sans, /<h1/);
});
