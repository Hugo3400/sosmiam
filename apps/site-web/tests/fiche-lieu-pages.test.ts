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

const IMAGE = "/app/lieux/images/0f8fad5b-d9cb-469f-a165-70867728950e.jpg";
const LOGO = "/app/lieux/images/7c9e6679-7425-40de-944b-e07fc1f90ae7.png";
const OFFICE = { nom: "l'office de tourisme de Montpellier", site: "montpellier-tourisme.fr", adresse: "https://www.montpellier-tourisme.fr", licence: null };

const BASE = {
  adresse: "3 rue du Port", emoji: "🛟", quartier: "Le Port", ville: "Montpellier", horaires: "Mar–sam, 12h–14h et 19h–23h", texte: "Le Capitaine régale la Brigade.",
  prix: "€€", couleurs: ["#FFB36B", "#E8590C"], decouvertPar: null, telephone: "+33 4 00 00 00 00", siteWeb: "https://capitaine.example", instagram: null,
  animaux: null, accessible: true, terrasse: null, wifi: null, enfants: null, parking: null, paiements: ["cb"], reservation: "conseillee", carte: null, carteMajLe: null, source: null,
};

const CARTE_RESTO = {
  majLe: "2026-10-20",
  sections: [
    { titre: "Entrées", elements: [{ nom: "Soupe de poissons", prix: 9 }] },
    { titre: "Plats", elements: [{ nom: "Risotto aux cèpes", prix: 18, signature: true, etiquettes: ["vege"] }] },
    { titre: "Vins", elements: [{ nom: "Picpoul de Pinet", prix: 6, alcool: true }] },
    { titre: "Bières", elements: [{ nom: "Blonde du coin", prix: 5, alcool: true }] },
  ],
};

const VOISIN = { id: 20, nom: "Le Joseph", type: "bar", emoji: "🍷", info: "Bar à tapas", quartier: "", ville: "Montpellier", prix: "€", couleurs: [], decouvertPar: null, logo: null, verifie: false, sos: { places: 3 } };

const RESTO_ENRICHI = {
  ...BASE, id: 18, nom: "Restaurant du Capitaine Bouiboui", type: "resto", info: "Bistrot de la mer", estVerifie: true, decouvertPar: "Zoé", carte: CARTE_RESTO,
  banniere: IMAGE, logo: LOGO, position: { latitude: 43.61, longitude: 3.87 }, sos: { places: 6, jusqua: "21:30", offre: "Le dessert du Capitaine offert" },
  ouverture: [{ jours: [0, 1, 2, 3, 4, 5, 6], de: "00:00", a: "24:00" }], etiquettes: ["Produits de la mer", "Fait maison"],
  autour: [VOISIN, { ...VOISIN, id: 21, nom: "Esencia", sos: null }, { ...VOISIN, id: 22, nom: "Les Mômes" }, { ...VOISIN, id: 23, nom: "Reflet d'Obione" }],
};
const RESTO_ANCIEN = { ...BASE, id: 19, nom: "Reflet d'Obione", type: "resto", info: "Restaurant gastronomique", estVerifie: false, source: OFFICE };
const BAR_SANS_CARTE = { ...BASE, id: 49, nom: "Esencia", type: "bar", emoji: "🍷", info: "Bar à vin", estVerifie: false, source: OFFICE, etiquettes: ["Entre potes"], ouverture: [], autour: [], banniere: null, logo: null, position: null, sos: null };
const BAR_AVEC_CARTE = { ...BAR_SANS_CARTE, id: 50, nom: "Le Vertigo", estVerifie: true, source: null, carte: CARTE_RESTO };

const PAR_SITE: Record<number, object> = { 18: RESTO_ENRICHI, 49: BAR_SANS_CARTE, 50: BAR_AVEC_CARTE };
const PAR_PUBLICS: Record<number, object> = { 19: RESTO_ANCIEN, 18: { ...RESTO_ENRICHI } };

let routeSiteEnLigne = true;
const chemins: string[] = [];
const serveur = createServer((requete, reponse) => {
  const chemin = requete.url ?? "";
  chemins.push(chemin);
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  const site = /^\/lieux\/site\/(\d+)$/.exec(chemin)?.[1];
  if (site !== undefined) {
    if (!routeSiteEnLigne) return repondre(404, { ok: false, erreur: "introuvable" });
    const lieu = PAR_SITE[Number(site)];
    return lieu ? repondre(200, { ok: true, lieu }) : repondre(404, { ok: false, erreur: "lieu-inconnu" });
  }
  const publics = /^\/lieux\/publics\/(\d+)$/.exec(chemin)?.[1];
  if (publics !== undefined) {
    const lieu = PAR_PUBLICS[Number(publics)];
    return lieu ? repondre(200, { ok: true, lieu }) : repondre(404, { ok: false, erreur: "lieu-inconnu" });
  }
  repondre(404, { ok: false, erreur: "introuvable" });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => serveur.close());
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

beforeEach(() => {
  routeSiteEnLigne = true;
  chemins.length = 0;
});

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, StaticRouterProvider, useLoaderData, useParams } = await import("react-router");
const pageFiche = await import("../src/routes/public/fiche-lieu.tsx");
const pageCarte = await import("../src/routes/public/carte-du-lieu.tsx");
const { default: MiseEnPagePublique } = await import("../src/routes/public/mise-en-page-publique.tsx");
const { default: routes } = await import("../src/routes.ts");

type Module = { default: (props: never) => unknown };
const avecDonnees = (module: Module) => () => h(module.default as never, { loaderData: useLoaderData(), params: useParams(), matches: [] } as never);

const handler = createStaticHandler([
  {
    id: "public",
    path: "/",
    Component: MiseEnPagePublique,
    children: [
      { id: "fiche", path: "lieux/:id", loader: pageFiche.loader as never, Component: avecDonnees(pageFiche as Module) },
      { id: "carte", path: "lieux/:id/carte", loader: pageCarte.loader as never, Component: avecDonnees(pageCarte as Module) },
    ],
  },
]);

async function interroger(adresse: string) {
  const contexte = await handler.query(new Request(`https://sosmiam.fr${adresse}`, { headers: { "x-real-ip": "203.0.113.9" } }));
  assert.ok(!(contexte instanceof Response), "pas de redirection attendue");
  return contexte;
}

async function servir(adresse: string) {
  const contexte = await interroger(adresse);
  assert.equal(contexte.statusCode, 200, adresse);
  const routeur = createStaticRouter(handler.dataRoutes, contexte);
  const html = renderToString(h(StaticRouterProvider, { router: routeur, context: contexte, hydrate: false }));
  const donnees = (contexte.loaderData as Record<string, unknown>)[adresse.endsWith("/carte") ? "carte" : "fiche"];
  return { html: html.replace(/[\u00a0\u202f]/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&"), donnees };
}

const compter = (texte: string, morceau: string) => texte.split(morceau).length - 1;
const MESSAGE = "L'abus d'alcool est dangereux pour la santé, à consommer avec modération.";
const lireContenu = (html: string) => /<main[^>]*>.*<\/main>/s.exec(html)?.[0] ?? "";
const lireActions = (html: string) => /<ul aria-label="Actions sur ce lieu".*?<\/ul>/.exec(html)?.[0] ?? "";

test("fiche enrichie (GET /lieux/site/:id) : bannière, logo, SOS, étiquettes, ouverture, carte, autour et données structurées", async () => {
  const { html } = await servir("/lieux/18");
  assert.deepEqual(chemins, ["/lieux/site/18"]);
  assert.match(html, new RegExp(`<img src="${IMAGE}" alt="" width="1600" height="500"`));
  assert.match(html, new RegExp(`<img src="${LOGO}" alt=""`));
  assert.match(html, /<h1[^>]*>Restaurant du Capitaine Bouiboui<\/h1>/);
  assert.match(html, /✓ Vérifié/);
  assert.match(html, /Bistrot de la mer · Restos · €€ · Le Port, Montpellier/);
  assert.match(html, /Ouvert · ferme à 0h/);
  assert.match(html, /Déniché par Zoé/);
  assert.match(html, /SOS ce soir/);
  assert.match(html, /6 places libres jusqu'à 21h30/);
  assert.match(html, /<p lang="fr"[^>]*>Le dessert du Capitaine offert<\/p>/);
  assert.match(html, /href="sosmiam:\/\/lieux\/18"[^>]*>Ouvre l'app pour y aller/);
  assert.match(html, /<li class="[^"]*">Produits de la mer<\/li>/);
  const actions = lireActions(html);
  for (const action of ["Itinéraire", "Appeler", "Site web"]) assert.match(actions, new RegExp(`</svg>${action}`), action);
  assert.doesNotMatch(actions, /Instagram|Réserver|Partager/, "pas d'Instagram ni de réservation sans données ; Partager attend JavaScript");
  assert.match(html, /href="\/lieux\/18\/carte"[^>]*>.*Voir toute la carte/);
  assert.match(html, /Mise à jour par le lieu le 20 octobre 2026/);
  assert.match(html, /<strong>La spécialité :\s?<\/strong><span lang="fr">Risotto aux cèpes<\/span>/);
  assert.equal(compter(lireContenu(html), MESSAGE), 1, "message sanitaire une seule fois, sous la carte");
  assert.match(html, /Réservation conseillée/);
  assert.match(html, /Paiement : carte bancaire/);
  assert.match(html, /href="\/lieux\?lieu=18&vue=carte"[^>]*>.*Agrandir la carte/);
  assert.match(html, /Autour de ce lieu/);
  assert.equal(compter(html, '<h3 class="font-titre text-[17px]'), 4);
  assert.doesNotMatch(html, /🍷/, "aucun emoji d'alcool en avant");
  assert.match(html, /C'est ton resto ?/);
  assert.match(html, /Rejoindre l'espace pro/);
  assert.match(html, /mailto:bonjour@sosmiam\.fr\?subject=/);
  assert.match(html, /aria-label="Actions rapides"/);
  const jsonLd = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/.exec(html)?.[1] ?? "[]") as Record<string, unknown>[];
  assert.equal(jsonLd[0]?.image, `https://sosmiam.fr${IMAGE}`);
  assert.equal(jsonLd[0]?.hasMenu, "https://sosmiam.fr/lieux/18/carte");
  assert.equal(jsonLd[1]?.["@type"], "BreadcrumbList");
  assert.match(html, /<link rel="canonical" href="https:\/\/sosmiam\.fr\/lieux\/18"/);
});

test("API plus ancienne (pas de /lieux/site) : la fiche retombe sur /lieux/publics/:id, sans les blocs qui n'ont pas de données", async () => {
  routeSiteEnLigne = false;
  const { html } = await servir("/lieux/19");
  assert.deepEqual(chemins, ["/lieux/site/19", "/lieux/publics/19"]);
  assert.doesNotMatch(html, /<img /);
  assert.doesNotMatch(html, /SOS ce soir|Autour de ce lieu|Agrandir la carte|Ouvert ·|Fermé ·|La carte</);
  assert.match(html, /Non vérifié/);
  assert.match(html, /Lieu non vérifié : il n'a pas encore de compte SOS Miam\. Ses infos viennent de l'office de tourisme de Montpellier\./);
  assert.match(html, /Texte et infos :\s?<!-- -->l'office de tourisme de Montpellier|Texte et infos :\s?l'office de tourisme de Montpellier/);
  assert.match(html, /<p lang="fr"[^>]*>Le Capitaine régale la Brigade\.<\/p>/);
  assert.match(html, /Où c'est/);
  assert.match(html, /Réclamer ma fiche/);
  routeSiteEnLigne = true;
  chemins.length = 0;
  await servir("/lieux/18");
  assert.deepEqual(chemins, ["/lieux/site/18"]);
});

test("lieu inconnu, brouillon ou adresse mal écrite : 404 ; la nouvelle route répond « lieu-inconnu » sans second appel", async () => {
  assert.equal((await interroger("/lieux/777")).statusCode, 404);
  assert.deepEqual(chemins, ["/lieux/site/777"]);
  routeSiteEnLigne = false;
  assert.equal((await interroger("/lieux/777")).statusCode, 404);
  for (const adresse of ["/lieux/0", "/lieux/abc", "/lieux/1234567890"]) assert.equal((await interroger(adresse)).statusCode, 404, adresse);
});

test("bar : message sanitaire toujours là, une seule fois ; ambiance des Miamis ; « C'est ton bar ? » ; jamais d'emoji d'alcool", async () => {
  const sansCarte = (await servir("/lieux/49")).html;
  assert.equal(compter(lireContenu(sansCarte), MESSAGE), 1);
  assert.match(sansCarte, /L'ambiance/);
  assert.match(sansCarte, /Entre potes/);
  assert.match(sansCarte, /C'est ton bar ?/);
  assert.doesNotMatch(sansCarte, /🍷/);
  assert.match(sansCarte, /🎶/);
  const avecCarte = (await servir("/lieux/50")).html;
  assert.equal(compter(lireContenu(avecCarte), MESSAGE), 1);
  assert.ok(avecCarte.indexOf(MESSAGE) > avecCarte.indexOf("Picpoul de Pinet"), "le message suit la carte");
});

test("noindex : fiche importée non vérifiée, oui ; fiche vérifiée, non ; introuvable, oui", async () => {
  const robots = (balises: { name?: string; content?: string }[]) => balises.find((balise) => balise.name === "robots")?.content;
  routeSiteEnLigne = false;
  const ancienne = (await servir("/lieux/19")).donnees;
  routeSiteEnLigne = true;
  assert.equal(robots(pageFiche.meta({ loaderData: ancienne } as never) as never), "noindex");
  const verifiee = (await servir("/lieux/18")).donnees;
  assert.equal(robots(pageFiche.meta({ loaderData: verifiee } as never) as never), undefined);
  assert.equal(robots(pageFiche.meta({ loaderData: undefined } as never) as never), "noindex");
});

test("carte en grand : rubriques en ancres, message sanitaire sous chaque rubrique avec alcool, Fermer vers la fiche, canonique sur elle-même", async () => {
  const { html, donnees } = await servir("/lieux/18/carte");
  assert.match(html, /<h1[^>]*>La carte<\/h1>/);
  assert.match(html, /Restaurant du Capitaine Bouiboui · mise à jour par le lieu le 20 octobre 2026/);
  for (const [ancre, titre] of [["carte-entrees", "Entrées"], ["carte-plats", "Plats"], ["carte-vins", "Vins"], ["carte-bieres", "Bières"]]) {
    assert.match(html, new RegExp(`href="#${ancre}"[^>]*>${titre}</a>`), titre);
    assert.match(html, new RegExp(`<h2 id="${ancre}"[^>]*>${titre}</h2>`), titre);
  }
  assert.equal(compter(lireContenu(html), MESSAGE), 2, "sous Vins et sous Bières");
  assert.match(html, /href="\/lieux\/18"[^>]*>.*Fermer<span class="sr-only"> la carte et revenir à la fiche de Restaurant du Capitaine Bouiboui<\/span>/);
  assert.doesNotMatch(html, /Imprimer|type="search"/, "sans JavaScript : ni Imprimer ni recherche, tout reste affiché");
  assert.match(html, /<link rel="canonical" href="https:\/\/sosmiam\.fr\/lieux\/18\/carte"/);
  assert.match(html, /data-impression="carte-du-lieu"/);
  const robots = (balises: { name?: string; content?: string }[]) => balises.find((balise) => balise.name === "robots")?.content;
  assert.equal(robots(pageCarte.meta({ loaderData: donnees } as never) as never), undefined);
  assert.equal(robots(pageCarte.meta({ loaderData: { ...(donnees as object), lieu: { ...(donnees as { lieu: object }).lieu, estVerifie: false, source: OFFICE } } } as never) as never), "noindex");
  assert.equal(robots(pageCarte.meta({ loaderData: undefined } as never) as never), "noindex");
});

test("carte en grand : 404 sans carte, pour un lieu inconnu ou une adresse mal écrite ; marche aussi avec l'ancienne API", async () => {
  assert.equal((await interroger("/lieux/49/carte")).statusCode, 404);
  assert.equal((await interroger("/lieux/777/carte")).statusCode, 404);
  assert.equal((await interroger("/lieux/abc/carte")).statusCode, 404);
  routeSiteEnLigne = false;
  assert.equal((await interroger("/lieux/19/carte")).statusCode, 404);
  const { html } = await servir("/lieux/18/carte");
  assert.match(html, /<h2 id="carte-vins"/);
});

test("routes.ts : la carte en grand juste après la fiche, avant la page introuvable ; noindex quand elle est introuvable", () => {
  const source = readFileSync(`${dossierSrc}routes.ts`, "utf8");
  assert.match(source, /route\("lieux\/:id", "routes\/public\/fiche-lieu\.tsx"\),\n\s*route\("lieux\/:id\/carte", "routes\/public\/carte-du-lieu\.tsx"\),/);
  const publiques = (routes as { children?: { path?: string; file: string }[] }[])[0]?.children ?? [];
  assert.ok(publiques.some((route) => route.path === "lieux/:id/carte"));
  assert.match(readFileSync(`${dossierSrc}routes/public/carte-du-lieu.tsx`, "utf8"), /if \(!loaderData\) return \[[^\n]*noindex/);
});
