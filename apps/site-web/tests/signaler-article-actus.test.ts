import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { registerHooks } from "node:module";
import type { AddressInfo } from "node:net";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

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

const { repondreApiActus } = await import("./actus-exemple.ts");

type Recu = { corps: unknown; ip: string | undefined; type: string | undefined };
let apiEnPanne = false;
let reponseSignalement: { statut: number; corps: unknown } = { statut: 201, corps: { ok: true } };
const recus: Recu[] = [];
const serveur = createServer((requete, reponse) => {
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  if (requete.method === "POST" && requete.url === "/signalements") {
    let texte = "";
    requete.on("data", (morceau: Buffer) => (texte += morceau.toString("utf8")));
    requete.on("end", () => {
      recus.push({ corps: JSON.parse(texte), ip: requete.headers["x-ip-visiteur"] as string | undefined, type: requete.headers["content-type"] });
      repondre(reponseSignalement.statut, reponseSignalement.corps);
    });
    return;
  }
  if (apiEnPanne) return repondre(500, { ok: false, erreur: "erreur-serveur" });
  const resultat = repondreApiActus(requete.url ?? "");
  return resultat ? repondre(resultat.statut, resultat.corps) : repondre(404, { ok: false, erreur: "introuvable" });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => {
  serveur.closeAllConnections();
  serveur.close();
});
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

beforeEach(() => {
  apiEnPanne = false;
  reponseSignalement = { statut: 201, corps: { ok: true } };
  recus.length = 0;
});

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, Outlet, StaticRouterProvider, useActionData, useLoaderData, useParams } = await import("react-router");
const pageArticle = await import("../src/routes/public/article-actus.tsx");
const pageSignaler = await import("../src/routes/public/signaler-article-actus.tsx");
const { default: routes } = await import("../src/routes.ts");
const { ContexteLangue } = await import("../src/hooks/utiliser-langue.ts");
const { estPageDoublee } = await import("../src/fonctions/langue/est-page-doublee.ts");
const { lireFormulaireSignalerArticleActus } = await import("../src/fonctions/actus/lire-formulaire-signaler-article-actus.ts");
const { lireCibleSignalementActus } = await import("../src/fonctions/actus/lire-cible-signalement-actus.ts");
const { RAISONS_SIGNALER_ARTICLE_ACTUS, TEXTES_SIGNALER_ARTICLE_ACTUS } = await import("../src/contenus/signaler-article-actus.ts");
const { TEXTES_SIGNALER_ARTICLE_ACTUS_ANGLAIS } = await import("../src/contenus/anglais/signaler-article-actus.ts");
const { ecrireMessageService } = await import("../src/fonctions/texte/ecrire-message-service.ts");
const { RAISONS_SIGNALEMENT } = await import("../../../packages/commun/src/types/signalement.ts");

type Module = { default: (props: never) => unknown };
const avecDonnees = (module: Module) => () =>
  h(module.default as never, { loaderData: useLoaderData(), actionData: useActionData(), params: useParams(), matches: [] } as never);

const handler = createStaticHandler([
  {
    id: "public",
    path: "/",
    Component: Outlet,
    children: [
      { id: "article", path: "actus/:id", loader: pageArticle.loader as never, Component: avecDonnees(pageArticle as Module) },
      { id: "signaler", path: "actus/:id/signaler", loader: pageSignaler.loader as never, action: pageSignaler.action as never, Component: avecDonnees(pageSignaler as Module) },
    ],
  },
]);

const IP = "203.0.113.9";
const T = TEXTES_SIGNALER_ARTICLE_ACTUS;
const nettoyer = (html: string) => html.replace(/[  ]/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const sansEspaces = (texte: string | undefined) => texte?.replace(/[  ]/g, " ");

async function interroger(adresse: string, champs?: Record<string, string>, { hote = "apercu.sosmiam.fr", langue = "fr" } = {}) {
  const entetes = { "x-real-ip": IP, cookie: `sosmiam-langue=${langue}` };
  const reglages: RequestInit = champs ? { method: "POST", body: new URLSearchParams(champs), headers: entetes } : { headers: entetes };
  const contexte = await handler.query(new Request(`https://${hote}${adresse}`, reglages));
  assert.ok(!(contexte instanceof Response), "pas de redirection attendue");
  return contexte;
}

async function servir(adresse: string, champs?: Record<string, string>, langue: "fr" | "en" = "fr") {
  const contexte = await interroger(adresse, champs, { langue });
  assert.equal(contexte.statusCode, 200, adresse);
  const routeur = h(StaticRouterProvider, { router: createStaticRouter(handler.dataRoutes, contexte), context: contexte, hydrate: false });
  return nettoyer(renderToString(h(ContexteLangue, { value: { langue, servies: ["fr", "en"] } }, routeur)));
}

function trouverBalise(html: string, nom: string, attributs: Record<string, string>): string | undefined {
  return html.match(new RegExp(`<${nom}\\b[^>]*>`, "g"))?.find((balise) => Object.entries(attributs).every(([cle, valeur]) => balise.includes(` ${cle}="${valeur}"`)));
}

function remplir(champs: Record<string, string>): FormData {
  const formulaire = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) formulaire.append(cle, valeur);
  return formulaire;
}

test("contenus : les mêmes raisons que packages/commun, chaque précision de 80 caractères au plus", () => {
  assert.deepEqual(RAISONS_SIGNALER_ARTICLE_ACTUS.map((raison) => raison.cle), [...RAISONS_SIGNALEMENT]);
  for (const raison of RAISONS_SIGNALER_ARTICLE_ACTUS) {
    for (const precision of raison.precisions) assert.ok(precision.length <= 80, precision);
    assert.equal(new Set(raison.precisions).size, raison.precisions.length, raison.cle);
  }
  assert.deepEqual(RAISONS_SIGNALER_ARTICLE_ACTUS.find((raison) => raison.cle === "autre")?.precisions, []);
});

test("lireCibleSignalementActus : l'article sans ?lieu, la réponse d'un lieu avec, rien d'autre", () => {
  assert.deepEqual(lireCibleSignalementActus(new URLSearchParams("")), { lieuId: null });
  assert.deepEqual(lireCibleSignalementActus(new URLSearchParams("lieu=21")), { lieuId: 21 });
  assert.deepEqual(lireCibleSignalementActus(new URLSearchParams("lieu=-10")), { lieuId: -10 });
  for (const lieu of ["", "abc", "1.5", "12345678901", "1e3"]) assert.equal(lireCibleSignalementActus(new URLSearchParams({ lieu })), null, lieu);
});

test("lireFormulaireSignalerArticleActus : un article, puis la réponse d'un lieu, texte nettoyé, précision de la raison choisie", () => {
  const champs = { raison: "pub-cachee", "precision-pub-cachee": "Article écrit contre de l'argent", "precision-haine": "Menaces", explication: "  Le lieu a payé\r\nl'article  ", site_web: "" };
  const article = lireFormulaireSignalerArticleActus(remplir(champs), { articleId: 3, lieuId: null });
  assert.ok(article.ok);
  assert.deepEqual(article.signalement, { cible: "article-actu", articleId: 3, raison: "pub-cachee", precision: "Article écrit contre de l'argent", explication: "Le lieu a payé\nl'article" });
  assert.equal(article.piege, "");
  const reponse = lireFormulaireSignalerArticleActus(remplir(champs), { articleId: 6, lieuId: 21 });
  assert.ok(reponse.ok);
  assert.deepEqual(Object.keys(reponse.signalement), ["cible", "articleId", "lieuId", "raison", "precision", "explication"]);
  assert.equal(reponse.signalement.cible, "reponse-actu");
  const autre = lireFormulaireSignalerArticleActus(remplir({ raison: "haine", "precision-danger": "Arme" }), { articleId: 3, lieuId: null });
  assert.ok(autre.ok);
  assert.equal(autre.signalement.precision, null);
  assert.equal(autre.signalement.explication, "");
});

test("lireFormulaireSignalerArticleActus : « Autre chose » demande 10 caractères, 500 au plus, raison obligatoire, piège rendu", () => {
  const cible = { articleId: 1, lieuId: null };
  const court = lireFormulaireSignalerArticleActus(remplir({ raison: "autre", explication: " 123456789 " }), cible);
  assert.ok(!court.ok);
  assert.deepEqual(Object.keys(court.erreurs), ["explication"]);
  assert.equal(sansEspaces(court.erreurs.explication), T.erreurs.explicationCourte);
  assert.ok(lireFormulaireSignalerArticleActus(remplir({ raison: "autre", explication: "1234567890" }), cible).ok);
  assert.ok(lireFormulaireSignalerArticleActus(remplir({ raison: "choquant", explication: "é".repeat(500) }), cible).ok);
  const long = lireFormulaireSignalerArticleActus(remplir({ raison: "choquant", explication: "é".repeat(501) }), cible);
  assert.ok(!long.ok);
  assert.equal(sansEspaces(long.erreurs.explication), T.erreurs.explicationLongue);
  const sansRaison = lireFormulaireSignalerArticleActus(remplir({ raison: "pas-une-raison", explication: "Bonjour" }), cible);
  assert.ok(!sansRaison.ok);
  assert.deepEqual(sansRaison.valeurs, { raison: "", precision: "", explication: "Bonjour" });
  const robot = lireFormulaireSignalerArticleActus(remplir({ raison: "arnaque", site_web: "https://robot.example" }), cible);
  assert.ok(robot.ok);
  assert.equal(robot.piege, "https://robot.example");
});

test("article : « Signaler cet article » en bas et « Signaler cette réponse » sous chaque mot du lieu, en nofollow", async () => {
  const html = await servir("/actus/6");
  const lienArticle = trouverBalise(html, "a", { rel: "nofollow", href: "/actus/6/signaler" });
  assert.ok(lienArticle);
  assert.match(html, />Signaler cet article<\/a>/);
  assert.ok(html.lastIndexOf("Signaler cet article") > html.indexOf("J'aime et commentaires, c'est dans l'app"));
  const tartines = html.indexOf('href="/actus/6/signaler?lieu=-10"');
  const salon = html.indexOf('href="/actus/6/signaler?lieu=-11"');
  assert.ok(tartines > 0 && salon > tartines);
  assert.ok(trouverBalise(html, "a", { rel: "nofollow", href: "/actus/6/signaler?lieu=-10" }));
  assert.match(html, />Signaler cette réponse<span class="sr-only"> de Les Tartines des Miamis<\/span><\/a>/);
  assert.equal(html.match(/Signaler cette réponse/g)?.length, 2);
  assert.doesNotMatch(await servir("/actus/2"), /Signaler cette réponse/);
});

test("page : l'article, ses raisons, l'explication, le champ piège caché, noindex et no-store", async () => {
  const html = await servir("/actus/1/signaler");
  assert.match(html, /<h1[^>]*>Signaler cet article<\/h1>/);
  assert.match(html, /L'article « Le Capitaine nous a ouvert sa cuisine » te pose souci \?/);
  assert.ok(trouverBalise(html, "form", { method: "post", action: "/actus/1/signaler#signaler-actus" }));
  assert.match(html, /href="\/actus\/1"[^>]*><span aria-hidden="true">← <\/span>Retour à l'article<\/a>/);
  for (const raison of RAISONS_SIGNALER_ARTICLE_ACTUS) {
    assert.ok(trouverBalise(html, "input", { type: "radio", name: "raison", value: raison.cle }), raison.cle);
    for (const precision of raison.precisions) assert.ok(html.includes(`name="precision-${raison.cle}" value="${precision}"`), precision);
  }
  assert.equal(trouverBalise(html, "input", { name: "raison", checked: "" }), undefined);
  assert.ok(trouverBalise(html, "textarea", { name: "explication", maxLength: "500" }));
  assert.match(html, /<div aria-hidden="true" class="absolute -left-\[9999px\][^"]*"><label[^>]*>Ne remplis pas ce champ<\/label><input[^>]*>/);
  assert.ok(trouverBalise(html, "input", { type: "text", name: "site_web", tabindex: "-1", autoComplete: "off" }));
  const robots = (balises: { name?: string; content?: string }[]) => balises.find((balise) => balise.name === "robots")?.content;
  const donnees = ((await interroger("/actus/1/signaler")).loaderData as Record<string, unknown>).signaler;
  assert.equal(robots(pageSignaler.meta({ loaderData: donnees, matches: [] } as never) as never), "noindex");
  assert.equal(robots(pageSignaler.meta({ loaderData: undefined, matches: [] } as never) as never), "noindex");
  assert.deepEqual(pageSignaler.headers(), { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" });
});

test("page : la réponse d'un lieu (?lieu=), son nom dans l'intro, et le formulaire garde ?lieu=", async () => {
  const html = await servir("/actus/6/signaler?lieu=-11");
  assert.match(html, /<h1[^>]*>Signaler cette réponse<\/h1>/);
  assert.match(html, /La réponse de Le Salon Chantilly des Miamis sous cet article te pose souci \?/);
  assert.ok(trouverBalise(html, "form", { method: "post", action: "/actus/6/signaler?lieu=-11#signaler-actus" }));
});

test("garde et 404 : sosmiam.fr, article inconnu, caché ou mal écrit, réponse absente ; rien ne part à l'API", async () => {
  for (const hote of ["sosmiam.fr", "www.sosmiam.fr"]) {
    assert.equal((await interroger("/actus/1/signaler", undefined, { hote })).statusCode, 404, hote);
    assert.equal((await interroger("/actus/1/signaler", { raison: "haine" }, { hote })).statusCode, 404, hote);
  }
  for (const adresse of ["/actus/99/signaler", "/actus/9/signaler", "/actus/10/signaler", "/actus/12/signaler", "/actus/abc/signaler", "/actus/1/signaler?lieu=abc", "/actus/1/signaler?lieu=-6", "/actus/2/signaler?lieu=-2"]) {
    assert.equal((await interroger(adresse)).statusCode, 404, adresse);
    assert.equal((await interroger(adresse, { raison: "haine" })).statusCode, 404, `POST ${adresse}`);
  }
  assert.equal(recus.length, 0);
  apiEnPanne = true;
  assert.equal((await interroger("/actus/1/signaler")).statusCode, 503);
  assert.equal((await interroger("/actus/1/signaler", { raison: "haine" })).statusCode, 503);
  assert.equal(recus.length, 0);
});

test("envoi : le corps exact à l'API pour un article, puis « Merci » et le retour à l'article", async () => {
  const html = await servir("/actus/3/signaler", {
    raison: "pub-cachee", "precision-pub-cachee": "Collaboration commerciale pas indiquée", explication: "Le lieu offre le repas sans le dire.", site_web: "",
  });
  assert.equal(recus.length, 1);
  assert.deepEqual(recus[0]?.corps, {
    cible: "article-actu", articleId: 3, raison: "pub-cachee", precision: "Collaboration commerciale pas indiquée", explication: "Le lieu offre le repas sans le dire.", source: "site",
  });
  assert.deepEqual(Object.keys(recus[0]?.corps as object), ["cible", "articleId", "raison", "precision", "explication", "source"]);
  assert.equal(recus[0]?.ip, IP);
  assert.match(recus[0]?.type ?? "", /^application\/json/);
  assert.match(html, /<h1[^>]*>Merci, l'équipe va regarder<\/h1>/);
  assert.match(html, /relit l'article et décide s'il peut rester en ligne/);
  assert.match(html, /href="\/actus\/3"[^>]*>Retour à l'article<\/a>/);
  assert.doesNotMatch(html, /<form/);
});

test("envoi : le corps exact à l'API pour la réponse d'un lieu", async () => {
  const html = await servir("/actus/6/signaler?lieu=-10", { raison: "autre", explication: "La réponse parle d'un autre lieu.", site_web: "" });
  assert.deepEqual(recus[0]?.corps, { cible: "reponse-actu", articleId: 6, lieuId: -10, raison: "autre", precision: null, explication: "La réponse parle d'un autre lieu.", source: "site" });
  assert.deepEqual(Object.keys(recus[0]?.corps as object), ["cible", "articleId", "lieuId", "raison", "precision", "explication", "source"]);
  assert.match(html, /relit la réponse du lieu/);
});

test("envoi : champ piège rempli, rien ne part à l'API mais le robot voit « Merci »", async () => {
  const html = await servir("/actus/1/signaler", { raison: "arnaque", explication: "", site_web: "https://robot.example" });
  assert.equal(recus.length, 0);
  assert.match(html, /Merci, l'équipe va regarder/);
});

test("envoi refusé par le site : rien ne part, les erreurs sous leur champ et les choix gardés", async () => {
  const html = await servir("/actus/1/signaler", { raison: "autre", explication: "Bof", site_web: "" });
  assert.equal(recus.length, 0);
  assert.match(html, /Un point à revoir avant d'envoyer\./);
  assert.match(html, /id="signaler-actus-explication-erreur"[^>]*>Pour « Autre chose », dis-nous en quelques mots/);
  assert.match(html, /<textarea[^>]*aria-invalid="true"[^>]*>Bof<\/textarea>/);
  assert.ok(trouverBalise(html, "input", { name: "raison", value: "autre", checked: "" }));
  const deux = await servir("/actus/1/signaler", { explication: "é".repeat(501), site_web: "" });
  assert.match(deux, /2 points à revoir avant d'envoyer\./);
  assert.match(deux, /Choisis ce qui ne va pas\./);
});

test("envoi refusé par l'API : 400 « signalement-invalide », 429 et panne, chacun son message, les choix gardés", async () => {
  const champs = { raison: "faux-lieu", "precision-faux-lieu": "Ce lieu n'existe pas", explication: "", site_web: "" };
  const cas: [number, unknown, string][] = [
    [400, { ok: false, erreur: "signalement-invalide" }, T.erreurs.refuse],
    [429, { ok: false, erreur: "trop-de-demandes" }, ecrireMessageService("trop-de-demandes", "fr")],
    [500, { ok: false, erreur: "erreur-serveur" }, ecrireMessageService("erreur-serveur", "fr")],
    [400, { ok: false, erreur: "autre-chose" }, ecrireMessageService("erreur-serveur", "fr")],
  ];
  for (const [statut, corps, message] of cas) {
    reponseSignalement = { statut, corps };
    const html = await servir("/actus/1/signaler", champs);
    assert.ok(html.includes(sansEspaces(message) ?? ""), `${statut} : ${message}`);
    assert.doesNotMatch(html, /Merci, l'équipe va regarder/);
    assert.ok(trouverBalise(html, "input", { name: "raison", value: "faux-lieu", checked: "" }));
    assert.ok(trouverBalise(html, "input", { name: "precision-faux-lieu", value: "Ce lieu n'existe pas", checked: "" }));
  }
  assert.equal(recus.length, cas.length);
});

test("en anglais : la page, les raisons, les erreurs et le merci ; les précisions partent en français", async () => {
  const A = TEXTES_SIGNALER_ARTICLE_ACTUS_ANGLAIS;
  const page = await servir("/actus/1/signaler", undefined, "en");
  assert.match(page, /<h1[^>]*>Report this story<\/h1>/);
  assert.match(page, /Is something wrong with the story “Le Capitaine nous a ouvert sa cuisine”\?/);
  assert.match(page, />Made-up or misleading place</);
  assert.ok(page.includes('name="precision-faux-lieu" value="Ce lieu n\'existe pas"'));
  assert.match(page, />This place doesn't exist</);
  assert.match(await servir("/actus/6", undefined, "en"), />Report this reply<span class="sr-only"> from Les Tartines des Miamis<\/span><\/a>/);
  const refus = await servir("/actus/1/signaler", { raison: "autre", explication: "Bof", site_web: "" }, "en");
  assert.ok(refus.includes(A.erreurs.unChamp));
  assert.ok(refus.includes(A.erreurs.explicationCourte));
  const merci = await servir("/actus/6/signaler?lieu=-11", { raison: "faux-lieu", "precision-faux-lieu": "Ce lieu n'existe pas", site_web: "" }, "en");
  assert.equal((recus[0]?.corps as { precision?: string }).precision, "Ce lieu n'existe pas");
  assert.match(merci, /<h1[^>]*>Thank you, the team will take a look<\/h1>/);
  assert.match(merci, />Back to the story<\/a>/);
});

test("routes.ts : /actus/:id/signaler juste après l'article, sans jumelle /en", () => {
  const source = readFileSync(`${dossierSrc}routes.ts`, "utf8");
  assert.match(source, /route\("actus\/:id", "routes\/public\/article-actus\.tsx"\),\n\s*route\("actus\/:id\/signaler", "routes\/public\/signaler-article-actus\.tsx"\),/);
  const publiques = (routes as { children?: { path?: string }[] }[])[0]?.children ?? [];
  assert.ok(publiques.some((route) => route.path === "actus/:id/signaler"));
  assert.doesNotMatch(source, /anglaise\("actus\/:id/);
  assert.ok(!estPageDoublee("/actus/1/signaler"));
});
