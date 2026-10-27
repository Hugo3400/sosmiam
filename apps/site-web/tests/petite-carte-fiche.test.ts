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

const { guetterApproche } = await import("../src/fonctions/carte-des-lieux/guetter-approche.ts");
const { avancerCarteMini } = await import("../src/fonctions/carte-des-lieux/avancer-carte-mini.ts");
const { createElement: h } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { CarteDuLieuMini } = await import("../src/composants/lieux/CarteDuLieuMini.tsx");

type Rappel = (entrees: { isIntersecting: boolean }[]) => void;

function creerFauxObservateur() {
  const suivi = { rappel: null as Rappel | null, reglages: null as IntersectionObserverInit | null | undefined, observes: [] as Element[], coupures: 0 };
  class FauxObservateur {
    constructor(rappel: Rappel, reglages?: IntersectionObserverInit) {
      suivi.rappel = rappel;
      suivi.reglages = reglages;
    }
    observe(element: Element) {
      suivi.observes.push(element);
    }
    disconnect() {
      suivi.coupures += 1;
    }
  }
  const signaler = (isIntersecting: boolean) => suivi.rappel?.([{ isIntersecting }]);
  return { suivi, Observateur: FauxObservateur as unknown as typeof IntersectionObserver, signaler };
}

const ELEMENT = { id: "boite-carte" } as unknown as Element;

test("guetterApproche : rien tant que la boîte est loin, une seule fois quand elle approche (300 px d'avance), puis l'observateur s'arrête", () => {
  const { suivi, Observateur, signaler } = creerFauxObservateur();
  let appels = 0;
  guetterApproche(ELEMENT, () => (appels += 1), Observateur);
  assert.deepEqual(suivi.observes, [ELEMENT]);
  assert.deepEqual(suivi.reglages, { rootMargin: "300px 0px" });
  signaler(false);
  assert.equal(appels, 0);
  signaler(true);
  assert.equal(appels, 1);
  assert.equal(suivi.coupures, 1);
  signaler(true);
  assert.equal(appels, 1, "pas de second chargement");
});

test("guetterApproche : arrêté avant que la boîte approche (page quittée), le chargement ne part jamais", () => {
  const { suivi, Observateur, signaler } = creerFauxObservateur();
  let appels = 0;
  const arreter = guetterApproche(ELEMENT, () => (appels += 1), Observateur);
  arreter();
  assert.equal(suivi.coupures, 1);
  signaler(true);
  assert.equal(appels, 0);
});

test("guetterApproche : sans IntersectionObserver (rendu serveur, vieux navigateur), la carte ne se charge pas, la boîte reste", () => {
  assert.equal(typeof IntersectionObserver, "undefined");
  let appels = 0;
  const arreter = guetterApproche(ELEMENT, () => (appels += 1));
  arreter();
  assert.equal(appels, 0);
  assert.doesNotThrow(() => guetterApproche(ELEMENT, () => (appels += 1), undefined)());
});

test("avancerCarteMini : repos → chargement si WebGL marche, sinon abandon ; prête ; erreur → abandon pour de bon", () => {
  assert.equal(avancerCarteMini("repos", { type: "approche", webgl: true }), "chargement");
  assert.equal(avancerCarteMini("repos", { type: "approche", webgl: false }), "abandon");
  assert.equal(avancerCarteMini("repos", { type: "carte", etat: "prete" }), "repos", "rien ne s'affiche avant l'approche");
  assert.equal(avancerCarteMini("chargement", { type: "carte", etat: "attente" }), "chargement");
  assert.equal(avancerCarteMini("chargement", { type: "carte", etat: "chargement" }), "chargement");
  assert.equal(avancerCarteMini("chargement", { type: "carte", etat: "prete" }), "prete");
  assert.equal(avancerCarteMini("chargement", { type: "carte", etat: "erreur" }), "abandon");
  assert.equal(avancerCarteMini("chargement", { type: "carte", etat: "sans-webgl" }), "abandon");
  assert.equal(avancerCarteMini("prete", { type: "approche", webgl: true }), "prete");
  assert.equal(avancerCarteMini("prete", { type: "carte", etat: "erreur" }), "abandon");
  assert.equal(avancerCarteMini("abandon", { type: "approche", webgl: true }), "abandon");
  assert.equal(avancerCarteMini("abandon", { type: "carte", etat: "prete" }), "abandon");
});

const LIEU = {
  id: 18, nom: "Restaurant du Capitaine Bouiboui", type: "resto", emoji: "🛟", info: "Bistrot", quartier: "Le Port", ville: "Montpellier", adresse: "3 rue du Port",
  prix: "€€", couleurs: [], decouvertPar: null, horaires: null, texte: null, telephone: null, siteWeb: null, instagram: null, estVerifie: true,
  animaux: null, accessible: null, terrasse: null, wifi: null, enfants: null, parking: null, paiements: [], reservation: null,
  position: { latitude: 43.61, longitude: 3.87 }, sos: null,
};

const rendre = (lieu: object) => renderToStaticMarkup(h(CarteDuLieuMini, { lieu } as never)).replace(/&amp;/g, "&").replace(/&#x27;/g, "'");

test("rendu serveur : la boîte d'attente (épingle, « Agrandir la carte »), jamais la carte elle-même ; sans position, pas de boîte", () => {
  const html = rendre(LIEU);
  assert.match(html, /<div class="relative h-\[200px\] border-b-2 border-encre" style="background-color:#F4ECD8;/);
  assert.match(html, /<a href="\/lieux\?lieu=18&vue=carte"[^>]*>.*Agrandir la carte<\/a>/);
  assert.match(html, /Où c'est/);
  assert.doesNotMatch(html, /data-carte-du-lieu|<canvas|maplibre/);
  const bar = rendre({ ...LIEU, type: "bar", emoji: "🍷" });
  assert.doesNotMatch(bar, /🍷/);
  const sansPosition = rendre({ ...LIEU, position: null });
  assert.doesNotMatch(sansPosition, /h-\[200px\]|Agrandir la carte/);
  assert.match(sansPosition, /Où c'est/);
});

test("chargement différé : la carte des lieux arrive par import dynamique, seulement après l'approche et le test de WebGL", () => {
  const source = readFileSync(`${dossierSrc}composants/lieux/CarteDuLieuMini.tsx`, "utf8");
  assert.doesNotMatch(source, /^import [^;]*CarteDesLieux"/m, "pas d'import statique");
  assert.doesNotMatch(source, /maplibre/);
  assert.match(source, /lazy\(\(\) => import\("~\/composants\/carte-des-lieux\/CarteDesLieux"\)/);
  assert.match(source, /guetterApproche\(boite\.current, \(\) => avancer\(\{ type: "approche", webgl: verifierWebgl\(\) \}\)\)/);
  assert.match(source, /variante="un-seul"/);
  assert.match(source, /lieuChoisi=\{id\}/);
  assert.match(source, /gestesCooperatifs/);
  assert.match(source, /surEtat=\{\(etatCarte\) => avancer\(\{ type: "carte", etat: etatCarte \}\)\}/);
  const carte = readFileSync(`${dossierSrc}composants/carte-des-lieux/CarteDesLieux.tsx`, "utf8");
  assert.match(carte, /rappels\.current\.surEtat\?\.\(etat\)/);
});
