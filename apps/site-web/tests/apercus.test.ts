// Aperçus publics (sosmiam.fr/preview et /preview/communaute) : noindex (balise et en-tête), servis sur sosmiam.fr
// seulement, ouverts dans robots.txt (pour que Google lise leur noindex), absents du menu et du plan du site (un lien « Ce qu'on prépare » dans le pied de page) ; et la page ne dit ni date
// ni promesse (règle de docs/decisions.md : ne rien inventer comme engagement).
// Les pages sont des .tsx, que Node ne lance pas : ce test les fait traduire par TypeScript (déjà dans le dépôt).
// Lancer : node --test tests/*.test.ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";
import { matchRoutes, type RouteObject } from "react-router";

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

const { createElement: h } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { MemoryRouter } = await import("react-router");
const { default: routes } = await import("../src/routes.ts");
const { choisirRedirectionHote } = await import("../src/fonctions/hotes/choisir-redirection-hote.ts");
const { loader: robots } = await import("../src/routes/ressources/robots.ts");
const { pagesIndexees } = await import("../src/contenus/plan-du-site.ts");
const { groupesPiedDePage } = await import("../src/contenus/liens-pied-de-page.ts");
const { liensPublics } = await import("../src/contenus/liens-publics.ts");
const { APERCUS, EN_PREPARATION } = await import("../src/contenus/apercus.ts");
const { lierPonctuation } = await import("../src/fonctions/texte/lier-ponctuation.ts");
const pageApercus = await import("../src/routes/public/apercus.tsx");
const pageCommunaute = await import("../src/routes/public/apercu-communaute.tsx");

const PAGES = [
  { chemin: "/preview", fichier: "routes/public/apercus.tsx", module: pageApercus },
  { chemin: "/preview/communaute", fichier: "routes/public/apercu-communaute.tsx", module: pageCommunaute },
];
const arbre = [{ path: "", children: routes }] as unknown as RouteObject[];
const lire = (fichier: string) => readFileSync(`${dossierSrc}${fichier}`, "utf-8");

/** Le HTML rendu par le serveur pour la page seule (sans le cadre public, qui a ses propres tests) */
function rendre(Page: () => unknown): string {
  return renderToStaticMarkup(h(MemoryRouter, null, h(Page as never)));
}

/** Les caractères échappés par React, remis en clair */
const decoder = (texte: string) =>
  texte.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** Le texte qui s'affiche, dans l'ordre de la page */
const texteVisible = (html: string) => decoder(html.replace(/<[^>]+>/g, " "));

/** Tout le texte d'une page : ce qui s'affiche, et ce que lisent les lecteurs d'écran (aria-label des dessins) */
function texteDe(html: string): string {
  const etiquettes = [...html.matchAll(/aria-label="([^"]*)"/g)].map((trouve) => decoder(trouve[1]));
  return [texteVisible(html), ...etiquettes].join(" \n ");
}

test("les deux aperçus sont des pages publiques de sosmiam.fr, dans le cadre public", () => {
  for (const { chemin, fichier } of PAGES) {
    const fichiers = (matchRoutes(arbre, chemin) ?? []).map((trouve) => (trouve.route as { file?: string }).file).filter(Boolean);
    assert.deepEqual(fichiers, ["routes/public/mise-en-page-publique.tsx", fichier], chemin);
  }
  // Chaque carte de /preview mène à une vraie page d'aperçu
  for (const apercu of APERCUS) assert.ok(PAGES.some((page) => page.chemin === apercu.adresse), apercu.adresse);
});

test("noindex : en balise (meta robots) et en en-tête HTTP (X-Robots-Tag)", () => {
  for (const { chemin, module } of PAGES) {
    const balises = module.meta() as { name?: string; content?: string; title?: string }[];
    assert.ok(balises.some((balise) => balise.name === "robots" && balise.content === "noindex"), chemin);
    assert.match(balises.find((balise) => balise.title)?.title ?? "", /— SOS Miam$/, chemin);
    assert.equal((module.headers() as Record<string, string>)["X-Robots-Tag"], "noindex", chemin);
  }
});

test("hôtes : servis sur sosmiam.fr ; depuis les espaces ambassadeur et pro, renvoyés vers sosmiam.fr (301)", () => {
  for (const chemin of ["/preview", "/preview/", "/Preview", "/preview.data", "/preview/communaute", "/preview/communaute.data?_routes=root"]) {
    assert.equal(choisirRedirectionHote("sosmiam.fr", chemin), null, chemin);
  }
  for (const hote of ["ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) {
    assert.deepEqual(choisirRedirectionHote(hote, "/preview"), { adresse: "https://sosmiam.fr/preview", statut: 301 }, hote);
    assert.deepEqual(
      choisirRedirectionHote(hote, "/preview/communaute?utm_source=discord"),
      { adresse: "https://sosmiam.fr/preview/communaute?utm_source=discord", statut: 301 },
      hote,
    );
  }
  // Aperçu et serveur de développement : servis tels quels, pour pouvoir les essayer
  for (const hote of ["apercu.sosmiam.fr", "127.0.0.1"]) assert.equal(choisirRedirectionHote(hote, "/preview/communaute"), null, hote);
});

test("robots.txt : /preview reste ouvert sur sosmiam.fr, pour que Google lise son noindex", async () => {
  const lireRobots = async (hote: string) => (await robots({ request: new Request(`https://${hote}/robots.txt`) } as never)).text();
  const texte = await lireRobots("sosmiam.fr");
  assert.doesNotMatch(texte, /preview/);
  assert.match(texte, /^Allow: \/$/m);
  // Les espaces n'ouvrent que leur page d'accueil : /preview y est fermé avec tout le reste
  for (const hote of ["ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) {
    const lignes = await lireRobots(hote);
    assert.match(lignes, /^Disallow: \/$/m, hote);
    assert.doesNotMatch(lignes, /preview/, hote);
  }
});

test("hors du plan du site et du menu ; dans le pied de page, un seul lien vers /preview (demande de Hugo, 15/10)", () => {
  assert.ok(!pagesIndexees.some((page) => page.startsWith("/preview")));
  const adressesPied = groupesPiedDePage.flatMap((groupe) => groupe.liens.map((lien) => lien.adresse));
  assert.deepEqual(adressesPied.filter((adresse) => adresse.includes("/preview")), ["/preview"]);
  assert.doesNotMatch(lire("composants/mise-en-page/EnTete.tsx"), /\/preview/);
});

// Une date : un mois (en entier ou abrégé), une année, « le 14 », « dimanche 19 », une saison ou « d'ici… »
const DATES: RegExp[] = [
  /(?<!\p{L})(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|janv|févr|fevr|sept|oct|nov|déc|dec)(?!\p{L})/iu,
  /(?<!\d)(19|20)\d{2}(?!\d)/u,
  /(?<!\p{L})(le|du|au)\s+(1er|premier|\d{1,2})(?!\d)/iu,
  /(?<!\p{L})(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+\d/iu,
  /(?<!\p{L})(été|automne|hiver|printemps|rentrée|trimestre|semestre|prochaine?|d['’]ici)(?!\p{L})/iu,
];
// Une promesse : « garanti », « promis », « bientôt »…
const PROMESSES = /(?<!\p{L})(garanti\p{L}*|promis\p{L}*|promesse\p{L}*|promet\p{L}*|promett\p{L}*|engag\p{L}*|bientôt|prochainement|sans faute|à coup sûr|assurément|certainement)(?!\p{L})/iu;

test("aucune date ni promesse dans le texte des aperçus (écrans dessinés et textes alternatifs compris)", () => {
  for (const { chemin, module } of PAGES) {
    const texte = texteDe(rendre(module.default));
    const descriptions = (module.meta() as { content?: string }[]).map((balise) => balise.content ?? "").join(" \n ");
    for (const source of [texte, descriptions]) {
      for (const motif of DATES) assert.doesNotMatch(source, motif, `${chemin} : une date (${source.match(motif)?.[0]})`);
      assert.doesNotMatch(source, PROMESSES, `${chemin} : une promesse (${source.match(PROMESSES)?.[0]})`);
    }
  }
  // Le test lui-même attrape bien ce qu'il doit attraper
  for (const exemple of ["Dispo en octobre", "Sortie en 2027", "dès le 14", "Rendez-vous dimanche 19", "d'ici l'été", "c'est promis", "garanti sans gluten", "Bientôt !"]) {
    assert.ok(DATES.some((motif) => motif.test(exemple)) || PROMESSES.test(exemple), exemple);
  }
  for (const permis of ["Fait maison", "Dim. 11 h", "Liste d'attente : 2 Miamis.", "Un rappel arrive la veille", "On y travaille"]) {
    assert.ok(!DATES.some((motif) => motif.test(permis)) && !PROMESSES.test(permis), permis);
  }
});

test("« En préparation : ça peut encore changer » en haut et en bas, et l'invitation au Discord avec le lien existant", () => {
  const discord = liensPublics.find((lien) => lien.reseau === "discord")?.adresse;
  assert.ok(discord);
  const phrase = lierPonctuation(EN_PREPARATION);
  for (const { chemin, module } of PAGES) {
    const html = rendre(module.default);
    const visible = texteVisible(html);
    const positions = [...visible.matchAll(new RegExp(phrase, "g"))].map((trouve) => trouve.index / visible.length);
    assert.ok(positions.length >= 2 && positions[0] < 0.2 && positions.at(-1)! > 0.8, `${chemin} : ${positions}`);
    assert.ok(html.includes(`href="${discord}"`), `${chemin} : lien Discord`);
    // Aucun autre lien vers l'extérieur que celui du Discord
    const externes = [...html.matchAll(/href="(https?:[^"]+)"/g)].map((trouve) => trouve[1]);
    assert.deepEqual([...new Set(externes)], [discord], chemin);
    // Les espaces fines de lierPonctuation sont partout : jamais une espace ordinaire avant ? ! : ; »
    assert.doesNotMatch(texteDe(html).replace(/\s+\n\s+/g, "\n"), /\S [?!:;»]/, chemin);
  }
});

test("accessibilité : un seul h1, et chaque téléphone dessiné a son texte alternatif, contenu caché aux lecteurs d'écran", () => {
  for (const { chemin, module } of PAGES) {
    const html = rendre(module.default);
    assert.equal(html.match(/<h1\b/g)?.length, 1, chemin);
    for (const dessin of html.matchAll(/<div role="img"([^>]*)>(<div[^>]*>)/g)) {
      assert.match(dessin[1], /aria-label="[^"]{20,}"/, chemin);
      assert.match(dessin[2], /aria-hidden="true"/, chemin);
    }
  }
  assert.equal([...rendre(pageCommunaute.default).matchAll(/role="img"/g)].length, 6);
});
