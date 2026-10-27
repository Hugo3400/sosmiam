import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
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

const { estHoteDEssai } = await import("../src/fonctions/hotes/est-hote-d-essai.ts");
const { estPageDoublee } = await import("../src/fonctions/langue/est-page-doublee.ts");
const { lireFiltresActus } = await import("../src/fonctions/actus/lire-filtres-actus.ts");
const { ecrireAdresseActus } = await import("../src/fonctions/actus/ecrire-adresse-actus.ts");
const { estArticleActusAlcool } = await import("../src/fonctions/actus/est-article-actus-alcool.ts");
const { estLieuAvecFiche } = await import("../src/fonctions/actus/est-lieu-avec-fiche.ts");
const { lireIdArticleActus } = await import("../src/fonctions/actus/lire-id-article-actus.ts");
const { trierReponsesLieux } = await import("../src/fonctions/actus/trier-reponses-lieux.ts");
const { listerArticlesActus, lireArticleActus } = await import("../src/services/actus.server.ts");
const { ARTICLES_ACTUS_EXEMPLE } = await import("../src/services/actus-exemple.server.ts");
const { MESSAGE_SANITAIRE_ALCOOL } = await import("../src/contenus/legal/prevention.ts");

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, MemoryRouter, Outlet, StaticRouterProvider, useLoaderData } = await import("react-router");
const pageActus = await import("../src/routes/public/actus.tsx");
const pageArticle = await import("../src/routes/public/article-actus.tsx");
const { CorpsArticleActus } = await import("../src/composants/actus/CorpsArticleActus.tsx");
const { MotsDesLieuxActus } = await import("../src/composants/actus/MotsDesLieuxActus.tsx");
const { ContexteLangue } = await import("../src/hooks/utiliser-langue.ts");

const afficher = (page: { default: unknown }) => () => h(page.default as never, { loaderData: useLoaderData(), params: {}, matches: [] } as never);

const handler = createStaticHandler([
  {
    id: "root",
    path: "/",
    Component: Outlet,
    children: [
      { id: "actus", path: "actus", loader: pageActus.loader as never, Component: afficher(pageActus) },
      { id: "en/actus", path: "en/actus", loader: pageActus.loader as never, Component: afficher(pageActus) },
      { id: "article-actus", path: "actus/:id", loader: pageArticle.loader as never, Component: afficher(pageArticle) },
    ],
  },
]);

async function servir(adresse: string, langueChoisie?: "fr" | "en") {
  const contexte = await handler.query(new Request(adresse));
  assert.ok(!(contexte instanceof Response));
  if (contexte.statusCode !== 200) return { statut: contexte.statusCode, html: "" };
  const langue = langueChoisie ?? (new URL(adresse).pathname.startsWith("/en/") ? "en" : "fr");
  const routeur = h(StaticRouterProvider, { router: createStaticRouter(handler.dataRoutes, contexte), context: contexte, hydrate: false });
  const html = renderToString(h(ContexteLangue, { value: { langue, servies: ["fr", "en"] } }, routeur));
  return { statut: 200, html: html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&") };
}

const titres = (html: string) => [...html.matchAll(/<h3 lang="fr"[^>]*><a [^>]*>([^<]+)<\/a><\/h3>/g)].map(([, titre]) => titre);
const titresPublies = (garder: (article: (typeof ARTICLES_ACTUS_EXEMPLE)[number]) => boolean) =>
  ARTICLES_ACTUS_EXEMPLE.filter((article) => article.statut === "publie" && !estArticleActusAlcool(article) && garder(article)).map((article) => article.titre);

test("estHoteDEssai : l'aperçu et les machines de développement, jamais le vrai site ni ses espaces", () => {
  for (const hote of ["apercu.sosmiam.fr", "APERCU.sosmiam.fr.", "localhost", "localhost:5190", "127.0.0.1:5344", "pro.localhost"]) assert.ok(estHoteDEssai(hote), hote);
  for (const hote of ["sosmiam.fr", "www.sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr", "apercu.sosmiam.fr.exemple.com", "exemple.fr"]) assert.ok(!estHoteDEssai(hote), hote);
});

test("garde : 404 sur sosmiam.fr et ses espaces, 200 sur l'aperçu et en développement", async () => {
  for (const hote of ["sosmiam.fr", "www.sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) {
    for (const chemin of ["/actus", "/en/actus", "/actus?rubrique=portrait", "/actus/1"]) assert.equal((await servir(`https://${hote}${chemin}`)).statut, 404, `${hote}${chemin}`);
  }
  for (const origine of ["https://apercu.sosmiam.fr", "http://localhost:5190", "http://127.0.0.1:5344"]) {
    for (const chemin of ["/actus", "/en/actus", "/actus/1"]) assert.equal((await servir(`${origine}${chemin}`)).statut, 200, `${origine}${chemin}`);
  }
});

test("/actus : les articles publiés, une seule h1, noindex, les filtres en liens et la ville en formulaire GET", async () => {
  const { html } = await servir("https://apercu.sosmiam.fr/actus");
  assert.equal(html.match(/<h1/g)?.length, 1);
  assert.match(html, /<h1[^>]*>Actus des Miamis<\/h1>/);
  assert.deepEqual([...titres(html)].sort(), titresPublies(() => true).sort());
  const ordre = [...html.matchAll(/href="\/actus\/(\d+)"/g)].map(([, id]) => ARTICLES_ACTUS_EXEMPLE.find((article) => article.id === Number(id)));
  assert.equal(ordre[0]?.aLaUne, true);
  const moments = ordre.slice(1).map((article) => Date.parse(article?.publieLe ?? ""));
  assert.deepEqual(moments, [...moments].sort((a, b) => b - a));
  assert.ok(titres(html).length >= 6 && titres(html).length <= 8);
  assert.match(html, /<a [^>]*href="\/actus\?rubrique=top-quartier"[^>]*>Tops du quartier<\/a>/);
  assert.match(html, /<a [^>]*href="\/actus\?rubrique=recit-sortie"[^>]*>Récits de sortie<\/a>/);
  assert.match(html, /<a [^>]*aria-current="true"[^>]*href="\/actus"|<a [^>]*href="\/actus"[^>]*aria-current="true"/);
  assert.match(html, /<form (?=[^>]*action="\/actus")(?=[^>]*method="get")[^>]*>/);
  assert.match(html, /<select [^>]*name="ville"/);
  assert.match(html, /<a [^>]*href="https:\/\/ambassadeur\.sosmiam\.fr\/programme"[^>]*>Devenir ambassadeur<\/a>/);
  assert.match(html, /href="\/actus\/1"/);
  const balises = pageActus.meta({ loaderData: { langue: "fr" } } as never) as { name?: string; content?: string }[];
  assert.ok(balises.some((balise) => balise.name === "robots" && balise.content === "noindex"));
  assert.deepEqual(pageActus.headers(), { "X-Robots-Tag": "noindex" });
  assert.deepEqual(pageArticle.headers(), { "X-Robots-Tag": "noindex" });
});

test("filtres : rubrique et ville lues dans l'adresse, combinées, et jamais une valeur inconnue", async () => {
  assert.deepEqual(lireFiltresActus(new URLSearchParams("rubrique=bon-plan&ville=Sète")), { rubrique: "bon-plan", ville: "sete" });
  assert.deepEqual(lireFiltresActus(new URLSearchParams("rubrique=bar&ville=")), { rubrique: null, ville: null });
  assert.deepEqual(lireFiltresActus(new URLSearchParams("")), { rubrique: null, ville: null });
  assert.equal(ecrireAdresseActus({ rubrique: null, ville: null }), "/actus");
  assert.equal(ecrireAdresseActus({ rubrique: "portrait", ville: "lyon" }), "/actus?rubrique=portrait&ville=lyon");

  const bonsPlans = await servir("https://apercu.sosmiam.fr/actus?rubrique=bon-plan");
  assert.deepEqual([...titres(bonsPlans.html)].sort(), titresPublies((article) => article.rubrique === "bon-plan").sort());
  assert.match(bonsPlans.html, /<a [^>]*aria-current="true"[^>]*>Bons plans<\/a>|<a [^>]*href="\/actus\?rubrique=bon-plan"[^>]*aria-current="true"/);
  assert.match(bonsPlans.html, /<input type="hidden" name="rubrique" value="bon-plan"/);

  const sete = await servir("https://apercu.sosmiam.fr/actus?ville=sete");
  assert.deepEqual([...titres(sete.html)].sort(), titresPublies((article) => article.lieux.some((lieu) => lieu.ville === "Sète")).sort());
  assert.match(sete.html, /href="\/actus\?rubrique=portrait&ville=sete"/);
  assert.match(sete.html, /<option value="sete" selected="">Sète<\/option>/);

  const lyonRecits = await servir("https://apercu.sosmiam.fr/actus?rubrique=recit-sortie&ville=Lyon");
  assert.deepEqual([...titres(lyonRecits.html)].sort(), titresPublies((article) => article.rubrique === "recit-sortie" && article.lieux.some((lieu) => lieu.ville === "Lyon")).sort());
  assert.equal(titres(lyonRecits.html).length, 1);

  const inconnue = await servir("https://apercu.sosmiam.fr/actus?ville=paris");
  assert.deepEqual(titres(inconnue.html), []);
  assert.match(inconnue.html, /Pas encore d'article par ici/);
});

test("jamais d'article sur un bar ou l'alcool, ni d'article non publié, sur aucune page", async () => {
  const base = { alcool: false, titre: "Un portrait", accroche: "Une accroche", citation: null, paragraphes: ["Des crêpes et du chocolat chaud."], reponsesLieux: [] as { lieuId: number; nomLieu: string; texte: string; repondueLe: string }[] };
  const lieu = { id: 0, nom: "La Crêperie des Miamis", type: "resto" as const, emoji: "🥞", quartier: "Centre", ville: "Lyon", verifie: true };
  assert.equal(estArticleActusAlcool({ ...base, lieux: [lieu] }), false);
  assert.equal(estArticleActusAlcool({ ...base, alcool: true, lieux: [lieu] }), true);
  assert.equal(estArticleActusAlcool({ ...base, lieux: [lieu, { ...lieu, type: "bar" as const }] }), true);
  for (const type of ["resto", "patisserie", "sortie"] as const) assert.equal(estArticleActusAlcool({ ...base, lieux: [{ ...lieu, type }] }), false, type);
  assert.equal(estArticleActusAlcool({ ...base, paragraphes: ["Un verre offert au comptoir."], lieux: [lieu] }), true);
  assert.equal(estArticleActusAlcool({ ...base, citation: "« Le meilleur spritz du quartier »", lieux: [lieu] }), true);
  assert.equal(estArticleActusAlcool({ ...base, lieux: [{ ...lieu, nom: "Le Bar à cocktails des Miamis" }] }), true);
  const reponse = { lieuId: lieu.id, nomLieu: lieu.nom, texte: "Merci ! Le café est offert.", repondueLe: "2026-10-25T18:00:00+02:00" };
  assert.equal(estArticleActusAlcool({ ...base, lieux: [lieu], reponsesLieux: [reponse] }), false);
  assert.equal(estArticleActusAlcool({ ...base, lieux: [lieu], reponsesLieux: [{ ...reponse, texte: "Merci ! L'apéro est offert." }] }), true);

  const { articles } = await listerArticlesActus({ rubrique: null, ville: null });
  assert.ok(articles.every((article) => !estArticleActusAlcool(article) && !article.alcool));
  const cachees = ARTICLES_ACTUS_EXEMPLE.filter((article) => article.statut !== "publie" || estArticleActusAlcool(article));
  assert.ok(cachees.some((article) => article.alcool) && cachees.some((article) => article.statut === "en-relecture") && cachees.some((article) => article.statut === "refuse") && cachees.some((article) => article.statut === "retire"));
  for (const article of cachees) {
    assert.equal(await lireArticleActus(article.id), null, article.titre);
    assert.equal((await servir(`https://apercu.sosmiam.fr/actus/${article.id}`)).statut, 404, article.titre);
  }
  const { html } = await servir("https://apercu.sosmiam.fr/actus");
  for (const article of cachees) assert.ok(!html.includes(article.titre), article.titre);
  assert.doesNotMatch(html, /Comptoir des Miamis|🍷/);
  for (const id of ["0", "abc", "1.5", "-1", "99"]) assert.equal((await servir(`https://apercu.sosmiam.fr/actus/${id}`)).statut, 404, id);
  assert.equal(lireIdArticleActus("12"), 12);
  assert.equal(lireIdArticleActus("0"), null);
});

test("message sanitaire mot pour mot sous un article marqué alcool, et rien sinon", () => {
  const article = { paragraphes: ["Premier.", "Deuxième.", "Troisième."], citation: "« Une citation »" };
  const avec = renderToString(h(CorpsArticleActus, { article: { ...article, alcool: true } })).replace(/&#x27;/g, "'");
  assert.ok(avec.includes(`<p lang="fr" class="rounded-[10px] border-2 border-encre bg-jaune-clair px-4 py-3 font-extrabold">${MESSAGE_SANITAIRE_ALCOOL}</p>`));
  assert.ok(avec.indexOf("Troisième.") < avec.indexOf(MESSAGE_SANITAIRE_ALCOOL));
  assert.ok(avec.indexOf("Deuxième.") < avec.indexOf("Une citation") && avec.indexOf("Une citation") < avec.indexOf("Troisième."));
  const sans = renderToString(h(CorpsArticleActus, { article: { ...article, alcool: false } })).replace(/&#x27;/g, "'");
  assert.ok(!sans.includes(MESSAGE_SANITAIRE_ALCOOL));
});

test("« Collaboration commerciale » sur l'article et sa carte quand il l'a, jamais sinon", async () => {
  const avecCollaboration = ARTICLES_ACTUS_EXEMPLE.filter((article) => article.statut === "publie" && article.collaboration && !estArticleActusAlcool(article));
  const sansCollaboration = ARTICLES_ACTUS_EXEMPLE.filter((article) => article.statut === "publie" && !article.collaboration && !estArticleActusAlcool(article));
  assert.ok(avecCollaboration.length > 0 && sansCollaboration.length > 0);
  for (const article of avecCollaboration) {
    const { html } = await servir(`https://apercu.sosmiam.fr/actus/${article.id}`);
    assert.match(html, /<span lang="fr">Collaboration commerciale<\/span><\/span>/, article.titre);
    assert.doesNotMatch(html, /partnership/);
    assert.match(html, /a reçu quelque chose du lieu pour cet article/);
    const anglais = await servir(`https://apercu.sosmiam.fr/actus/${article.id}`, "en");
    assert.match(anglais.html, /<span lang="fr">Collaboration commerciale<\/span> · paid or gifted partnership<\/span>/, article.titre);
    assert.match(anglais.html, /received something from the place for this story/);
  }
  for (const article of sansCollaboration) {
    const { html } = await servir(`https://apercu.sosmiam.fr/actus/${article.id}`);
    assert.doesNotMatch(html, /Collaboration commerciale/, article.titre);
    assert.match(html, /n'a rien reçu du lieu pour l'écrire/);
  }
  const liste = await servir("https://apercu.sosmiam.fr/actus");
  assert.equal(liste.html.match(/<span lang="fr">Collaboration commerciale<\/span><\/span>/g)?.length, avecCollaboration.length);
  const listeAnglaise = await servir("https://apercu.sosmiam.fr/en/actus");
  assert.equal(listeAnglaise.html.match(/<span lang="fr">Collaboration commerciale<\/span> · paid or gifted partnership<\/span>/g)?.length, avecCollaboration.length);
  for (const article of sansCollaboration) {
    const anglais = await servir(`https://apercu.sosmiam.fr/actus/${article.id}`, "en");
    assert.doesNotMatch(anglais.html, /Collaboration commerciale|partnership/, article.titre);
  }
});

test("un article : une h1, le contenu en français balisé, lecture seule, « Voir la fiche » seulement avec un vrai lieu", async () => {
  const { html } = await servir("https://apercu.sosmiam.fr/actus/1");
  assert.equal(html.match(/<h1/g)?.length, 1);
  assert.match(html, /<h1 lang="fr"[^>]*>Le Capitaine nous a ouvert sa cuisine<\/h1>/);
  assert.match(html, /<div lang="fr" class="flex flex-col gap-5/);
  assert.match(html, />Ambassadeur·rice</);
  assert.match(html, /Le mot du lieu/);
  assert.match(html, /J'aime et commentaires, c'est dans l'app/);
  assert.match(html, /Pas encore l'app/);
  assert.doesNotMatch(html, /sosmiam:\/\/|Lire dans l'app/);
  assert.match(html, /href="\/actus"/);
  assert.doesNotMatch(html, /<button|<input|<textarea|href="\/lieux\//);
  assert.equal(estLieuAvecFiche({ id: 0 }), false);
  assert.equal(estLieuAvecFiche({ id: -3 }), false);
  assert.equal(estLieuAvecFiche({ id: 1.5 }), false);
  assert.equal(estLieuAvecFiche({ id: 12 }), true);
  const balises = pageArticle.meta({ loaderData: { article: await lireArticleActus(1) } } as never) as { name?: string; content?: string; title?: string }[];
  assert.ok(balises.some((balise) => balise.name === "robots" && balise.content === "noindex"));
  assert.ok(balises.some((balise) => balise.title === "Le Capitaine nous a ouvert sa cuisine — SOS Miam"));
});

test("/en/actus : l'interface en anglais, les liens restent en anglais, les articles en français", async () => {
  assert.ok(estPageDoublee("/actus") && estPageDoublee("/actus?rubrique=portrait"));
  assert.ok(!estPageDoublee("/actus/3"));
  const { html } = await servir("https://apercu.sosmiam.fr/en/actus?rubrique=portrait");
  assert.match(html, /<h1[^>]*>News from the Miamis<\/h1>/);
  assert.match(html, /<a [^>]*href="\/en\/actus\?rubrique=recit-sortie"[^>]*>Days out<\/a>/);
  assert.match(html, /<form (?=[^>]*action="\/en\/actus")(?=[^>]*method="get")[^>]*>/);
  assert.match(html, />Ambassador</);
  assert.match(html, /<h3 lang="fr"[^>]*><a [^>]*href="\/actus\/1"[^>]*>Le Capitaine nous a ouvert sa cuisine<\/a><\/h3>/);
  assert.match(html, />Become an ambassador<\/a>/);
  assert.doesNotMatch(html, /Devenir ambassadeur|Toutes les villes/);
  const balises = pageActus.meta({ loaderData: { langue: "en" } } as never) as { title?: string }[];
  assert.ok(balises.some((balise) => balise.title?.startsWith("News from the Miamis")));
});

test("le mot des lieux : une réponse par bloc, dans l'ordre des lieux de l'article, et aucun bloc sans réponse", async () => {
  const reponse = (lieuId: number, nomLieu: string) => ({ lieuId, nomLieu, texte: `Mot de ${nomLieu} (${lieuId})`, repondueLe: "2026-10-25T18:00:00+02:00" });
  const lieux = [{ id: 11 }, { id: 12 }, { id: 13 }];
  assert.deepEqual(trierReponsesLieux([reponse(13, "C"), reponse(99, "Inconnu"), reponse(11, "A")], lieux).map((un) => un.lieuId), [11, 13, 99]);
  const homonymes = [{ id: 21 }, { id: 22 }];
  const triees = trierReponsesLieux([reponse(22, "Chez Nous"), reponse(21, "Chez Nous")], homonymes);
  assert.deepEqual(triees.map((un) => [un.lieuId, un.texte]), [[21, "Mot de Chez Nous (21)"], [22, "Mot de Chez Nous (22)"]]);
  const lieuHomonyme = { nom: "Chez Nous", type: "resto" as const, emoji: "🍲", quartier: "Centre", ville: "Lyon", verifie: true };
  const rendu = renderToString(
    h(MemoryRouter, null, h(MotsDesLieuxActus, { article: { id: 4, lieux: [{ ...lieuHomonyme, id: 21 }, { ...lieuHomonyme, id: 22 }], reponsesLieux: [reponse(22, "Chez Nous"), reponse(21, "Chez Nous")] } })),
  );
  assert.equal(rendu.match(/Le mot du lieu/g)?.length, 2);
  assert.ok(rendu.indexOf("Mot de Chez Nous (21)") > 0 && rendu.indexOf("Mot de Chez Nous (21)") < rendu.indexOf("Mot de Chez Nous (22)"));
  assert.ok(rendu.indexOf('href="/actus/4/signaler?lieu=21"') < rendu.indexOf('href="/actus/4/signaler?lieu=22"'));
  const avecDeux = ARTICLES_ACTUS_EXEMPLE.find((article) => article.statut === "publie" && article.reponsesLieux.length > 1);
  assert.ok(avecDeux && avecDeux.rubrique === "top-quartier");
  const { html } = await servir(`https://apercu.sosmiam.fr/actus/${avecDeux.id}`);
  assert.equal(html.match(/>Le mot du lieu<\/h2>/g)?.length, avecDeux.reponsesLieux.length);
  const ordreLieux = avecDeux.lieux.filter((lieu) => avecDeux.reponsesLieux.some((un) => un.lieuId === lieu.id)).map((lieu) => lieu.nom);
  assert.equal(new Set(avecDeux.lieux.map((lieu) => lieu.id)).size, avecDeux.lieux.length);
  const positions = ordreLieux.map((nom) => html.indexOf(`<p lang="fr" class="font-bold">${nom}</p>`));
  assert.ok(positions.every((position) => position > 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  const ids = [...html.matchAll(/<section aria-labelledby="([^"]+)"[^>]*border-dashed/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, avecDeux.reponsesLieux.length);
  const sansReponse = ARTICLES_ACTUS_EXEMPLE.find((article) => article.statut === "publie" && article.reponsesLieux.length === 0 && !estArticleActusAlcool(article));
  assert.ok(sansReponse);
  assert.doesNotMatch((await servir(`https://apercu.sosmiam.fr/actus/${sansReponse.id}`)).html, /Le mot du lieu/);
});
