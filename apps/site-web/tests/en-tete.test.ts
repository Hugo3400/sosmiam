// Rendu serveur de l'en-tête des pages publiques (src/composants/mise-en-page/EnTete.tsx, MenuMobile, MenuSansJavascript) :
// les liens attendus et leurs adresses (les espaces ambassadeur et pro en adresse complète), « Préviens-moi » à la place de
// « Je m'inscris », la page où l'on est (aria-current), et le bouton « Menu » (aria-expanded, aria-controls) avec son dialogue.
// Les composants sont des .tsx, que Node ne lance pas : ce test les fait traduire par TypeScript (déjà dans le dépôt).
// Lancer : node --test tests/*.test.ts
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

const { createElement: h } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { MemoryRouter } = await import("react-router");
const { EnTete } = await import("../src/composants/mise-en-page/EnTete.tsx");
const { creerAdresseLien } = await import("../src/fonctions/hotes/creer-adresse-lien.ts");

type Lien = { texte: string; adresse: string; courant: string | null };

/** Les caractères échappés par React, remis en clair */
const decoder = (texte: string) =>
  texte.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Le HTML de l'en-tête rendu par le serveur, à l'adresse donnée */
function rendre(adresse: string): string {
  return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [adresse] }, h(EnTete)));
}

/** Le morceau de `html` qui va de `debut` à `fin` (inclus) */
function extraire(html: string, debut: string, fin: string): string {
  const position = html.indexOf(debut);
  assert.notEqual(position, -1, `${debut} absent`);
  return html.slice(position, html.indexOf(fin, position) + fin.length);
}

/** Les liens d'un morceau de HTML : texte (sans les balises), adresse et aria-current */
function lireLiens(html: string): Lien[] {
  return [...html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs)].map(([, attributs, contenu]) => ({
    texte: decoder(contenu.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()),
    adresse: decoder(attributs.match(/href="([^"]*)"/)?.[1] ?? ""),
    courant: attributs.match(/aria-current="([^"]*)"/)?.[1] ?? null,
  }));
}

/** Les parties de l'en-tête : la barre des grands écrans, sa droite, le menu sans JavaScript et le dialogue */
function decouper(html: string) {
  const enTete = extraire(html, "<header", "</header>");
  const barre = extraire(enTete, "<nav", "</nav>");
  const sansJavascript = extraire(enTete, "<details", "</details>");
  const dialogue = extraire(html, "<dialog", "</dialog>");
  return { enTete, barre, sansJavascript, dialogue };
}

const AMBASSADEURS = "https://ambassadeur.sosmiam.fr/programme";
const PROS = "https://pro.sosmiam.fr/bienvenue";
const BARRE = [
  ["L'app", "/#comment"],
  ["Les lieux", "/lieux"],
  ["BIG SOS", "/#big-sos"],
  ["Ambassadeurs", AMBASSADEURS],
  ["Pros", PROS],
];
const MENU = [
  ["L'app", "/#comment"],
  ["Les lieux", "/lieux"],
  ["BIG SOS", "/#big-sos"],
  ["FAQ", "/faq"],
  ["Ambassadeurs", AMBASSADEURS],
  ["Pros", PROS],
  ["Mon compte", "/mon-compte"],
];

test("grands écrans : le logo, cinq liens au milieu, puis « Mon compte » et « Préviens-moi » (la newsletter)", () => {
  const { enTete, barre } = decouper(rendre("/"));
  assert.match(enTete, /^<header class="sticky top-0/, "collant en haut");
  assert.match(barre, /^<nav aria-label="Menu principal"/);
  assert.deepEqual(lireLiens(barre).map((lien) => [lien.texte, lien.adresse]), BARRE);
  const liens = lireLiens(enTete);
  assert.deepEqual(liens[0], { texte: "", adresse: "/", courant: null }, "le logo d'abord, vers l'accueil");
  assert.match(enTete, /<a aria-label="SOS Miam, accueil"[^>]*href="\/"/);
  const droite = enTete.slice(enTete.indexOf("</nav>"), enTete.indexOf("<button"));
  assert.deepEqual(lireLiens(droite).map((lien) => [lien.texte, lien.adresse]), [
    ["Mon compte", "/mon-compte"],
    ["Préviens-moi", "/#inscription"],
    ["Préviens-moi", "/#inscription"],
  ], "« Mon compte » et « Préviens-moi » (grands écrans), puis « Préviens-moi » seul dès 768 px");
});

test("plus de « Je m'inscris » ambigu, ni d'aperçu (/preview), ni d'ancre vers les sections pros et ambassadeurs", () => {
  const html = decoder(rendre("/"));
  assert.doesNotMatch(html, /Je m'inscris/);
  assert.doesNotMatch(html, /\/preview/);
  assert.doesNotMatch(html, /href="\/#(pros|ambassadeurs)"/);
});

test("le bouton « Menu » (sous 1024 px) désigne son dialogue fermé : aria-expanded et aria-controls", () => {
  const { enTete, dialogue } = decouper(rendre("/faq"));
  const bouton = enTete.match(/<button\b[^>]*>/)?.[0] ?? "";
  assert.match(bouton, /type="button"/);
  assert.match(bouton, /aria-expanded="false"/);
  assert.match(bouton, /aria-controls="menu-mobile"/);
  assert.match(bouton, /lg:hidden|noscript:hidden/);
  assert.match(enTete, /Menu<\/button>/, "un nom visible");
  assert.match(dialogue, /^<dialog id="menu-mobile" aria-label="Menu"/);
  const baliseDialogue = (dialogue.match(/^<dialog\b[^>]*>/)?.[0] ?? "").replace(/ class="[^"]*"/, "");
  assert.doesNotMatch(baliseDialogue, /\sopen\b/, "fermé au rendu serveur");
  assert.match(dialogue, /<button type="button"[^>]*>.*Fermer<\/button>/s, "un bouton « Fermer » dans le menu");
});

test("le menu des petits écrans : « Découvrir » puis « Rejoindre », de gros liens, et « Préviens-moi » en bas", () => {
  const { dialogue } = decouper(rendre("/"));
  const titres = [...dialogue.matchAll(/<h2 id="([^"]+)"[^>]*>(.*?)<\/h2>/g)].map(([, id, titre]) => [id, titre]);
  assert.deepEqual(titres, [["menu-mobile-groupe-0", "Découvrir"], ["menu-mobile-groupe-1", "Rejoindre"]]);
  for (const [id] of titres) assert.match(dialogue, new RegExp(`<ul aria-labelledby="${id}"`));
  const liens = lireLiens(dialogue);
  assert.deepEqual(liens[0], { texte: "", adresse: "/", courant: null }, "le logo, vers l'accueil");
  // Chaque lien : son nom (en gros), sa petite phrase, une flèche
  const duMenu = liens.slice(1, -1);
  assert.equal(duMenu.length, MENU.length);
  duMenu.forEach((lien, position) => {
    const [nom, adresse] = MENU[position];
    assert.equal(lien.adresse, adresse, nom);
    assert.ok(lien.texte.startsWith(`${nom} `) && lien.texte.endsWith(" →") && lien.texte.length > nom.length + 10, lien.texte);
  });
  assert.deepEqual(liens.at(-1), { texte: "Préviens-moi", adresse: "/#inscription", courant: null });
});

test("sans JavaScript : un <details> (montré seulement par @media (scripting: none)) avec les mêmes liens", () => {
  const { sansJavascript } = decouper(rendre("/"));
  assert.match(sansJavascript, /^<details class="[^"]*\bhidden noscript:block\b/);
  assert.match(sansJavascript, /<summary\b/);
  const liens = lireLiens(sansJavascript);
  assert.deepEqual(liens.map((lien) => lien.adresse), [...MENU.map(([, adresse]) => adresse), "/#inscription"]);
  assert.match(sansJavascript, /id="menu-sans-javascript-groupe-0"/, "des id à part : deux menus vivent dans la page");
});

test("aria-current : la page où l'on est, et rien d'autre", () => {
  const courants = (adresse: string) => lireLiens(rendre(adresse)).filter((lien) => lien.courant !== null);

  // L'accueil : aucune section n'est « lue » au rendu serveur (le suivi des sections démarre dans le navigateur)
  assert.deepEqual(courants("/"), []);
  // La FAQ : son lien, dans le menu et dans le menu sans JavaScript (pas dans la barre des grands écrans)
  assert.deepEqual(courants("/faq").map((lien) => [lien.texte.split(" ")[0], lien.adresse, lien.courant]), [
    ["FAQ", "/faq", "page"],
    ["FAQ", "/faq", "page"],
  ]);
  // Mon compte : dans la barre, le menu et le menu sans JavaScript
  const compte = courants("/mon-compte");
  assert.equal(compte.length, 3);
  for (const lien of compte) assert.deepEqual([lien.adresse, lien.courant], ["/mon-compte", "page"]);
  const lieux = courants("/lieux");
  assert.equal(lieux.length, 3);
  for (const lien of lieux) assert.deepEqual([lien.adresse, lien.courant], ["/lieux", "page"]);
  // Une fiche de lieu ou « J'inscris mon lieu » : aucun lien de l'en-tête n'est la page
  assert.deepEqual(courants("/lieux/12"), []);
  assert.deepEqual(courants("/inscrire-mon-lieu"), []);
});

test("les adresses entre sosmiam.fr et ses espaces (en-tête et pied de page)", () => {
  assert.equal(creerAdresseLien("ambassadeur", "/programme", "principal"), AMBASSADEURS);
  assert.equal(creerAdresseLien("pro", "/bienvenue", "principal"), PROS);
  assert.equal(creerAdresseLien("principal", "/faq", "principal"), "/faq");
  assert.equal(creerAdresseLien("principal", "/faq", "pro"), "https://sosmiam.fr/faq");
  assert.equal(creerAdresseLien("ambassadeur", "/connexion", "ambassadeur"), "/connexion");
  assert.equal(creerAdresseLien("externe", "mailto:bonjour@sosmiam.fr", "pro"), "mailto:bonjour@sosmiam.fr");
});
