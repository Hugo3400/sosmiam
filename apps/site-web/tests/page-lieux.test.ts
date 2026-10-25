import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createServer, type IncomingHttpHeaders } from "node:http";
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

const lieu = (id: number, autres: Record<string, unknown> = {}) => ({
  id, nom: `Lieu ${id}`, type: "resto", emoji: "🍲", info: "Bistrot", quartier: "Écusson", ville: "Montpellier", prix: "€€",
  couleurs: ["#FFB36B", "#E8590C"], decouvertPar: null, logo: null, verifie: false, sos: null, ...autres,
});
const VILLES = [
  { ville: "Paris", nombre: 939 }, { ville: "Marseille", nombre: 746 }, { ville: "Lille", nombre: 193 }, { ville: "Lyon", nombre: 190 },
  { ville: "Strasbourg", nombre: 170 }, { ville: "Montpellier", nombre: 135 }, { ville: "Bordeaux", nombre: 39 }, { ville: "Roubaix", nombre: 26 },
  { ville: "Nantes", nombre: 21 }, { ville: "Marcq-en-Barœul", nombre: 12 }, { ville: "Pérols", nombre: 3 },
];

let nouvellesAdresses = true;
const appels: { chemin: string; entetes: IncomingHttpHeaders }[] = [];
const serveur = createServer((requete, reponse) => {
  const chemin = requete.url ?? "";
  appels.push({ chemin, entetes: requete.headers });
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  const adresse = new URL(chemin, "http://api");
  if (adresse.pathname === "/lieux") return repondre(200, { ok: true, lieux: Array.from({ length: 48 }, (_, rang) => ({ ...lieu(rang + 1), verifie: undefined, sos: undefined })) });
  if (!nouvellesAdresses) return repondre(404, { ok: false, erreur: "introuvable" });
  if (adresse.pathname === "/lieux/villes") return repondre(200, { ok: true, villes: [...VILLES, { ville: "", nombre: 4 }, { ville: "Sans nombre" }] });
  if (adresse.pathname === "/lieux/liste") {
    const page = Number(adresse.searchParams.get("page") ?? "1");
    return repondre(200, {
      ok: true, total: 135, page: Math.min(page, 6), pages: 6,
      lieux: [lieu(18, { verifie: true, sos: { places: 6 }, logo: "/app/lieux/images/7c9e6679-7425-40de-944b-e07fc1f90ae7.png" }), lieu(19), lieu(20, { type: "inconnu" }), { id: "21" }],
    });
  }
  repondre(404, { ok: false, erreur: "introuvable" });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => {
  serveur.closeAllConnections();
  serveur.close();
});
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

beforeEach(() => {
  nouvellesAdresses = true;
  appels.length = 0;
});

const { lireFiltresLieux } = await import("../src/fonctions/page-lieux/lire-filtres-lieux.ts");
const { ecrireAdresseLieux } = await import("../src/fonctions/page-lieux/ecrire-adresse-lieux.ts");
const { ecrireIdentifiantVille } = await import("../src/fonctions/page-lieux/ecrire-identifiant-ville.ts");
const { trouverVille } = await import("../src/fonctions/page-lieux/trouver-ville.ts");
const { listerPagesVisibles } = await import("../src/fonctions/page-lieux/lister-pages-visibles.ts");
const { choisirVilleProche } = await import("../src/fonctions/page-lieux/choisir-ville-proche.ts");
const { lireCheminCanonique } = await import("../src/fonctions/seo/lire-chemin-canonique.ts");
const { creerAdresseCanonique } = await import("../src/fonctions/seo/creer-adresse-canonique.ts");
const { listerPageLieux, listerVillesLieux } = await import("../src/services/page-lieux.server.ts");

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, StaticRouterProvider, useLoaderData } = await import("react-router");
const pageLieux = await import("../src/routes/public/lieux.tsx");
const { default: MiseEnPagePublique } = await import("../src/routes/public/mise-en-page-publique.tsx");

const handler = createStaticHandler([
  {
    id: "public",
    path: "/",
    Component: MiseEnPagePublique,
    children: [{ id: "lieux", path: "lieux", loader: pageLieux.loader as never, Component: () => h(pageLieux.default as never, { loaderData: useLoaderData(), params: {}, matches: [] } as never) }],
  },
]);

type DonneesLieux = Awaited<ReturnType<typeof pageLieux.loader>>;

async function servir(adresse: string) {
  const contexte = await handler.query(new Request(`https://sosmiam.fr${adresse}`, { headers: { "x-real-ip": "203.0.113.9" } }));
  assert.ok(!(contexte instanceof Response));
  assert.equal(contexte.statusCode, 200, adresse);
  const html = renderToString(h(StaticRouterProvider, { router: createStaticRouter(handler.dataRoutes, contexte), context: contexte, hydrate: false }));
  const donnees = (contexte.loaderData as Record<string, DonneesLieux>).lieux;
  const meta = pageLieux.meta({ loaderData: donnees } as never) as unknown as Record<string, string>[];
  return { html: html.replace(/[  ]/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&"), donnees, meta };
}

const estSansIndex = (meta: Record<string, string>[]) => meta.some((balise) => balise.name === "robots" && balise.content === "noindex");

test("lireFiltresLieux : ville, type connu, recherche nettoyée (60 signes), page de 1 à 1000, vue et lieu", () => {
  const lire = (requete: string) => lireFiltresLieux(new URLSearchParams(requete));
  assert.deepEqual(lire(""), { ville: null, type: null, recherche: null, page: 1, vue: "liste", lieu: null });
  assert.deepEqual(lire("ville=+montpellier+&type=bar&q=++pizza+++napolitaine+&page=3&vue=carte&lieu=18"), {
    ville: "montpellier", type: "bar", recherche: "pizza napolitaine", page: 3, vue: "carte", lieu: 18,
  });
  assert.equal(lire("type=cinema").type, null);
  assert.equal(lire(`q=${"a".repeat(80)}`).recherche, "a".repeat(60));
  for (const [page, attendue] of [["0", 1], ["-2", 1], ["2.5", 1], ["abc", 1], ["9999", 1000], ["12", 12]] as const) assert.equal(lire(`page=${page}`).page, attendue, page);
  assert.equal(lire("vue=plan").vue, "liste");
  for (const valeur of ["0", "-3", "abc", "1e3"]) assert.equal(lire(`lieu=${valeur}`).lieu, null, valeur);
});

test("ecrireAdresseLieux : ordre fixe, page 1, vue liste et valeurs vides omises", () => {
  assert.equal(ecrireAdresseLieux({}), "/lieux");
  assert.equal(ecrireAdresseLieux({ ville: "montpellier", page: 2 }), "/lieux?ville=montpellier&page=2");
  assert.equal(ecrireAdresseLieux({ page: 2, type: "resto", ville: "paris", recherche: "pâtes fraîches", vue: "carte", lieu: 18 }), "/lieux?ville=paris&type=resto&q=p%C3%A2tes+fra%C3%AEches&page=2&vue=carte&lieu=18");
  assert.equal(ecrireAdresseLieux({ ville: null, type: null, recherche: "", page: 1, vue: "liste", lieu: null }), "/lieux");
});

test("identifiant des villes : sans accents, ligatures ni apostrophes ; retrouvé quelle que soit l'écriture", () => {
  assert.equal(ecrireIdentifiantVille("Marcq-en-Barœul"), "marcq-en-baroeul");
  assert.equal(ecrireIdentifiantVille("Villeneuve-d'Ascq"), "villeneuve-d-ascq");
  assert.equal(ecrireIdentifiantVille("Lyon Saint-Exupéry"), "lyon-saint-exupery");
  assert.deepEqual(trouverVille("marcq-en-baroeul", VILLES), { ville: "Marcq-en-Barœul", nombre: 12 });
  assert.deepEqual(trouverVille("MONTPELLIER", VILLES), { ville: "Montpellier", nombre: 135 });
  assert.equal(trouverVille("toulouse", VILLES), null);
  assert.equal(trouverVille("---", VILLES), null);
});

test("listerPagesVisibles : la première, la dernière, les voisines, et « … » pour les trous", () => {
  assert.deepEqual(listerPagesVisibles(1, 1), [1]);
  assert.deepEqual(listerPagesVisibles(1, 3), [1, 2, 3]);
  assert.deepEqual(listerPagesVisibles(1, 40), [1, 2, 3, "ellipse", 40]);
  assert.deepEqual(listerPagesVisibles(20, 40), [1, "ellipse", 19, 20, 21, "ellipse", 40]);
  assert.deepEqual(listerPagesVisibles(40, 40), [1, "ellipse", 38, 39, 40]);
  assert.deepEqual(listerPagesVisibles(5, 9), [1, "ellipse", 4, 5, 6, "ellipse", 9]);
  assert.deepEqual(listerPagesVisibles(4, 9), [1, 2, 3, 4, 5, "ellipse", 9]);
});

test("choisirVilleProche : la commune elle-même, sinon la ville la plus fournie de la région, sinon rien", () => {
  assert.deepEqual(choisirVilleProche({ commune: "Pérols", region: "Occitanie" }, VILLES), { ville: { ville: "Pérols", nombre: 3 }, memeCommune: true });
  assert.deepEqual(choisirVilleProche({ commune: "Toulouse", region: "Occitanie" }, VILLES), { ville: { ville: "Montpellier", nombre: 135 }, memeCommune: false });
  assert.deepEqual(choisirVilleProche({ commune: "Versailles", region: "Île-de-France" }, VILLES)?.ville.ville, "Paris");
  assert.deepEqual(choisirVilleProche({ commune: "Lens", region: "Hauts-de-France" }, VILLES)?.ville.ville, "Lille");
  assert.equal(choisirVilleProche({ commune: "Rennes", region: "Bretagne" }, VILLES), null);
});

test("adresse canonique : une page peut garder ses paramètres (cheminCanonique de son loader)", () => {
  assert.equal(lireCheminCanonique([{ loaderData: { consentement: {} } }, { loaderData: { cheminCanonique: "/lieux?ville=paris" } }]), "/lieux?ville=paris");
  assert.equal(lireCheminCanonique([{ loaderData: { cheminCanonique: "https://ailleurs.example" } }, { loaderData: undefined }]), null);
  assert.equal(creerAdresseCanonique("https://sosmiam.fr", "/lieux", "ville=paris&page=2"), "https://sosmiam.fr/lieux?ville=paris&page=2");
  assert.equal(creerAdresseCanonique("https://sosmiam.fr", "/lieux/"), "https://sosmiam.fr/lieux");
});

test("services : villes et page lues à l'API avec l'IP du visiteur, lignes de forme inattendue écartées", async () => {
  const villes = await listerVillesLieux("203.0.113.9");
  assert.ok(villes.ok);
  assert.equal(villes.donnees.length, VILLES.length);
  const page = await listerPageLieux({ ville: "Montpellier", type: "resto", recherche: "bistrot", page: 9 }, "203.0.113.9");
  assert.ok(page.ok);
  assert.deepEqual(page.donnees.lieux.map(({ id }) => id), [18, 19]);
  assert.equal(page.donnees.page, 6);
  assert.deepEqual(page.donnees.lieux[0].sos, { places: 6 });
  assert.equal(appels[1].chemin, "/lieux/liste?ville=Montpellier&type=resto&q=bistrot&page=9");
  for (const appel of appels) assert.equal(appel.entetes["x-ip-visiteur"], "203.0.113.9");
  nouvellesAdresses = false;
  assert.deepEqual(await listerPageLieux({ ville: null, type: null, recherche: null, page: 1 }, null), { ok: false, erreur: "absente" });
});

test("/lieux : liste, filtres en liens, pagination, canonique avec ville, type et page seulement", async () => {
  const { html, donnees, meta } = await servir("/lieux?ville=MONTPELLIER&type=resto&q=&page=2");
  assert.equal(appels.find(({ chemin }) => chemin.startsWith("/lieux/liste"))?.chemin, "/lieux/liste?ville=Montpellier&type=resto&page=2");
  assert.equal(donnees.cheminCanonique, "/lieux?ville=montpellier&type=resto&page=2");
  assert.match(html, /<link rel="canonical" href="https:\/\/sosmiam\.fr\/lieux\?ville=montpellier&type=resto&page=2"\/>/);
  assert.equal(estSansIndex(meta), false);
  assert.equal(meta[0].title, "Montpellier : les restos (page 2) — SOS Miam");
  assert.match(html, /<h1[^>]*>Les lieux<\/h1>/);
  assert.match(html, /<a aria-current="true"[^>]*href="\/lieux\?ville=montpellier&type=resto"[^>]*>Montpellier<\/a>/);
  assert.match(html, /href="\/lieux\?ville=marcq-en-baroeul&type=resto"/);
  assert.match(html, /href="\/lieux\?type=resto"[^>]*>Partout<\/a>/);
  assert.match(html, /<form role="search"[^>]*action="\/lieux" method="get">/);
  assert.match(html, /<input type="hidden" name="ville" value="montpellier"\/>/);
  assert.match(html, /135 lieux · ceux en SOS ce soir d'abord/);
  assert.match(html, /SOS ce soir · 6 places/);
  assert.match(html, /Non vérifié/);
  assert.match(html, /<a[^>]*rel="prev"[^>]*href="\/lieux\?ville=montpellier&type=resto"/);
  assert.match(html, /<a[^>]*rel="next"[^>]*href="\/lieux\?ville=montpellier&type=resto&page=3"/);
  assert.match(html, /<span aria-current="page"[^>]*><span class="sr-only">Page 2<\/span>/);
  assert.match(html, /<nav aria-label="Affichage"[^>]*>.*href="\/lieux\?ville=montpellier&type=resto&vue=carte"/s);
  assert.doesNotMatch(html, /titre-carte-plein-ecran/);
});

test("/lieux : une recherche est en noindex, et la canonique oublie la recherche", async () => {
  const { html, meta } = await servir("/lieux?q=pizza&ville=paris");
  assert.ok(estSansIndex(meta));
  assert.match(html, /<link rel="canonical" href="https:\/\/sosmiam\.fr\/lieux\?ville=paris"\/>/);
  assert.match(html, /Ta recherche : « pizza »/);
  assert.match(html, /href="\/lieux\?ville=paris"[^>]*>Effacer la recherche/);
});

test("/lieux : sans les nouvelles adresses de l'API, un message aimable « bientôt », en noindex, sans carte", async () => {
  nouvellesAdresses = false;
  const { html, donnees, meta } = await servir("/lieux?ville=paris");
  assert.equal(donnees.etat, "bientot");
  assert.ok(estSansIndex(meta));
  assert.match(html, /La carte des lieux arrive très vite/);
  assert.match(html, /href="\/#adresses"/);
  assert.doesNotMatch(html, /Carte des lieux|bg-\[#F4ECD8\]/);
});

test("/lieux?vue=carte : la carte en plein écran (dialogue ouvert sans JavaScript), sans lire la liste", async () => {
  const { html, meta } = await servir("/lieux?vue=carte&ville=lille&lieu=18");
  assert.ok(!appels.some(({ chemin }) => chemin.startsWith("/lieux/liste")));
  assert.equal(estSansIndex(meta), false);
  assert.match(html, /<link rel="canonical" href="https:\/\/sosmiam\.fr\/lieux\?ville=lille"\/>/);
  assert.match(html, /<dialog open="" aria-labelledby="titre-carte-plein-ecran"/);
  assert.match(html, /<h1 id="titre-carte-plein-ecran"[^>]*>Carte des lieux en plein écran<\/h1>/);
  assert.match(html, /href="\/lieux\?ville=lille"[^>]*>.*Fermer la carte/s);
  assert.match(html, /href="\/lieux\?ville=lille&type=bar&vue=carte"/);
  assert.match(html, /<noscript>.*La carte a besoin de JavaScript/s);
  assert.match(html, /© OpenFreeMap.*© OpenMapTiles.*© OpenStreetMap/s);
});
