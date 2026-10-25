import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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

const LOGO = "/app/lieux/images/7c9e6679-7425-40de-944b-e07fc1f90ae7.png";
const lieu = (id: number, autres: Record<string, unknown> = {}) => ({
  id, nom: `Lieu ${id}`, type: "resto", emoji: "🍷", info: "Bistrot", quartier: "", ville: "Lille", prix: "€",
  couleurs: [], decouvertPar: null, logo: null, verifie: false, sos: null, ...autres,
});

let nouvellesAdresses = true;
const chemins: string[] = [];
const serveur = createServer((requete, reponse) => {
  const chemin = requete.url ?? "";
  chemins.push(chemin);
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  const adresse = new URL(chemin, "http://api");
  if (adresse.pathname === "/lieux") return repondre(200, { ok: true, lieux: Array.from({ length: 48 }, (_, rang) => ({ ...lieu(rang + 1), verifie: undefined, sos: undefined, logo: rang === 0 ? "/ailleurs.png" : null })) });
  if (!nouvellesAdresses) return repondre(404, { ok: false, erreur: "introuvable" });
  if (adresse.pathname === "/lieux/villes") return repondre(200, { ok: true, villes: [{ ville: "Paris", nombre: 2000 }, { ville: "Lille", nombre: 791 }] });
  if (adresse.pathname === "/lieux/accueil") return repondre(200, { ok: true, lieux: [lieu(7, { verifie: true, sos: { places: 1 }, logo: LOGO }), lieu(8, { type: "bar" }), lieu(9, { verifie: true })] });
  if (adresse.pathname === "/lieux/carte") {
    return repondre(200, { ok: true, epingles: [
      { id: 1, nom: "Un", type: "bar", latitude: 50.63, longitude: 3.06, sos: true },
      { id: 2, nom: "Deux", type: "resto", latitude: "50", longitude: 3, sos: false },
      { id: 3, nom: "Trois", type: "resto", latitude: 95, longitude: 3, sos: false },
    ] });
  }
  if (adresse.pathname === "/lieux/site/18") return repondre(200, { ok: true, lieu: { ...lieu(18), estVerifie: true, adresse: " 3 rue du Port ", sos: { places: 6, jusqua: "21:30" }, verifie: undefined } });
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
  chemins.length = 0;
});

const { reecrireAdresseFondDeCarte } = await import("../src/fonctions/carte-des-lieux/reecrire-adresse-fond-de-carte.ts");
const { arrondirPosition } = await import("../src/fonctions/carte-des-lieux/arrondir-position.ts");
const { creerDonneesGeojson } = await import("../src/fonctions/carte-des-lieux/creer-donnees-geojson.ts");
const { calculerCadreEpingles } = await import("../src/fonctions/carte-des-lieux/calculer-cadre-epingles.ts");
const { lireLieuListe } = await import("../src/fonctions/page-lieux/lire-lieu-liste.ts");
const { listerLieuxAccueil } = await import("../src/services/page-lieux.server.ts");
const { loader: chargerEpingles } = await import("../src/routes/ressources/epingles-lieux.ts");
const { loader: chargerApercu } = await import("../src/routes/ressources/apercu-lieu.ts");
const { loader: chargerPlan } = await import("../src/routes/ressources/plan-du-site.ts");
const { pagesIndexees } = await import("../src/contenus/plan-du-site.ts");

const { createElement: h } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { MemoryRouter } = await import("react-router");
const { IlsOntBesoinDeToi } = await import("../src/composants/accueil/IlsOntBesoinDeToi.tsx");

const LETTRES = { resto: "R", patisserie: "P", bar: "B", sortie: "S" };
const requete = (adresse: string) => new Request(`https://sosmiam.fr${adresse}`, { headers: { "x-real-ip": "203.0.113.9" } });
const nettoyer = (html: string) => html.replace(/[  ]/g, " ").replace(/&#x27;/g, "'");

test("fond de carte : toutes les adresses d'OpenFreeMap passent par /fond-de-carte/ du site, le reste ne bouge pas", () => {
  const origine = "https://sosmiam.fr";
  const cas = [
    ["https://tiles.openfreemap.org/styles/liberty", "https://sosmiam.fr/fond-de-carte/styles/liberty"],
    ["https://tiles.openfreemap.org/planet", "https://sosmiam.fr/fond-de-carte/planet"],
    ["https://tiles.openfreemap.org/planet/20261018_080001_pt/14/8301/5640.pbf", "https://sosmiam.fr/fond-de-carte/planet/20261018_080001_pt/14/8301/5640.pbf"],
    ["https://tiles.openfreemap.org/fonts/Noto%20Sans%20Bold/0-255.pbf", "https://sosmiam.fr/fond-de-carte/fonts/Noto%20Sans%20Bold/0-255.pbf"],
    ["https://tiles.openfreemap.org/sprites/ofm_f384/ofm@2x.json", "https://sosmiam.fr/fond-de-carte/sprites/ofm_f384/ofm@2x.json"],
    ["https://tiles.openfreemap.org/natural_earth/ne2sr/3/4/2.png", "https://sosmiam.fr/fond-de-carte/natural_earth/ne2sr/3/4/2.png"],
  ];
  for (const [avant, apres] of cas) assert.equal(reecrireAdresseFondDeCarte(avant, origine), apres);
  assert.equal(reecrireAdresseFondDeCarte("https://tiles.openfreemap.org/styles/liberty", "https://apercu.sosmiam.fr/"), "https://apercu.sosmiam.fr/fond-de-carte/styles/liberty");
  for (const autre of ["https://sosmiam.fr/fond-de-carte/planet", "/lieux/epingles", "https://tiles.openfreemap.org.example/planet", "http://tiles.openfreemap.org/planet"]) {
    assert.equal(reecrireAdresseFondDeCarte(autre, origine), autre);
  }
});

test("la bibliothèque de la carte n'est chargée que dans le navigateur, par un import dynamique, avec son travailleur servi par le site", () => {
  const fichiers = (dossier: string): string[] =>
    readdirSync(dossier).flatMap((nom) => (statSync(`${dossier}/${nom}`).isDirectory() ? fichiers(`${dossier}/${nom}`) : [`${dossier}/${nom}`]));
  const avecMaplibre = fichiers(dossierSrc.replace(/\/$/, "")).filter((fichier) => /^import (?!type )[^;]*from "maplibre-gl"/m.test(readFileSync(fichier, "utf8")));
  assert.deepEqual(avecMaplibre.map((fichier) => fichier.slice(dossierSrc.length)), ["composants/carte-des-lieux/charger-maplibre.ts"]);
  const chargeur = readFileSync(`${dossierSrc}composants/carte-des-lieux/charger-maplibre.ts`, "utf8");
  assert.match(chargeur, /from "maplibre-gl\/dist\/maplibre-gl-worker\.mjs\?url"/);
  assert.match(chargeur, /setWorkerUrl\(/);
  const carte = readFileSync(`${dossierSrc}composants/carte-des-lieux/CarteDesLieux.tsx`, "utf8");
  assert.match(carte, /import\("~\/composants\/carte-des-lieux\/charger-maplibre"\)/);
  assert.match(carte, /transformRequest: \(adresse\) => \(\{ url: reecrireAdresseFondDeCarte\(adresse, window\.location\.origin\) \}\)/);
  assert.match(carte, /attributionControl: false/);
  assert.match(readFileSync(`${dossierSrc}composants/carte-des-lieux/reglages-carte-des-lieux.ts`, "utf8"), /"https:\/\/tiles\.openfreemap\.org\/styles\/liberty"/);
});

test("épingles : GeoJSON [longitude, latitude] avec la lettre du type, filtre « en SOS », cadre et position arrondie", () => {
  const epingles = [
    { id: 1, nom: "Un", type: "bar" as const, latitude: 50.63, longitude: 3.06, sos: true },
    { id: 2, nom: "Deux", type: "resto" as const, latitude: 43.61, longitude: 3.87, sos: false },
  ];
  const donnees = creerDonneesGeojson(epingles, LETTRES);
  assert.deepEqual(donnees.features[0], { type: "Feature", id: 1, geometry: { type: "Point", coordinates: [3.06, 50.63] }, properties: { id: 1, nom: "Un", type: "bar", sos: true, lettre: "B" } });
  assert.deepEqual(creerDonneesGeojson(epingles, LETTRES, true).features.map((element) => element.id), [1]);
  assert.deepEqual(calculerCadreEpingles(epingles), [[3.06, 43.61], [3.87, 50.63]]);
  assert.equal(calculerCadreEpingles([]), null);
  assert.deepEqual(arrondirPosition({ latitude: 43.611234, longitude: 3.876789 }, 2), { latitude: 43.61, longitude: 3.88 });
  assert.deepEqual(arrondirPosition({ latitude: 43.611234, longitude: 3.876789 }, 3), { latitude: 43.611, longitude: 3.877 });
});

test("lireLieuListe : forme vérifiée, logo de nos images seulement, SOS seulement pour un lieu vérifié", () => {
  assert.equal(lireLieuListe({ ...lieu(1), type: "cinema" }), null);
  assert.equal(lireLieuListe({ ...lieu(1), nom: " " }), null);
  assert.equal(lireLieuListe({ ...lieu(-1) }), null);
  assert.equal(lireLieuListe({ ...lieu(1), logo: "https://ailleurs.example/logo.png" })?.logo, null);
  assert.equal(lireLieuListe({ ...lieu(1), logo: LOGO, verifie: true })?.logo, LOGO);
  assert.equal(lireLieuListe({ ...lieu(1), sos: { places: 4 } })?.sos, null);
  assert.deepEqual(lireLieuListe({ ...lieu(1), verifie: true, sos: { places: 4 } })?.sos, { places: 4 });
});

test("GET /lieux/epingles : les épingles valables de l'API, en JSON, noindex ; 404 tant que l'API ne les a pas", async () => {
  const reponse = await chargerEpingles({ request: requete("/lieux/epingles?ville=Lille&type=bar"), params: {} } as never);
  assert.equal(reponse.status, 200);
  assert.equal(reponse.headers.get("X-Robots-Tag"), "noindex");
  assert.deepEqual(await reponse.json(), { ok: true, epingles: [{ id: 1, nom: "Un", type: "bar", latitude: 50.63, longitude: 3.06, sos: true }] });
  assert.equal(chemins.at(-1), "/lieux/carte?ville=Lille&type=bar");
  nouvellesAdresses = false;
  const absente = await chargerEpingles({ request: requete("/lieux/epingles"), params: {} } as never);
  assert.equal(absente.status, 404);
});

test("GET /lieux/apercu/:id : de quoi remplir la carte du lieu choisi ; 404 sinon", async () => {
  const reponse = await chargerApercu({ request: requete("/lieux/apercu/18"), params: { id: "18" } } as never);
  const { lieu: apercu } = (await reponse.json()) as { lieu: Record<string, unknown> };
  assert.equal(apercu.verifie, true);
  assert.equal(apercu.adresse, "3 rue du Port");
  assert.deepEqual(apercu.sos, { places: 6 });
  for (const id of ["19", "abc", "0"]) {
    assert.equal((await chargerApercu({ request: requete(`/lieux/apercu/${id}`), params: { id } } as never)).status, 404, id);
  }
});

test("accueil : les 8 lieux de GET /lieux/accueil ; sans cette adresse, 8 des lieux de GET /lieux", async () => {
  const nouveaux = await listerLieuxAccueil("203.0.113.9");
  assert.equal(nouveaux.tirage, true);
  assert.deepEqual(nouveaux.lieux?.map(({ id }) => id), [7, 8, 9]);
  nouvellesAdresses = false;
  const anciens = await listerLieuxAccueil(null);
  assert.equal(anciens.tirage, false);
  assert.equal(anciens.lieux?.length, 8);
  assert.equal(anciens.lieux?.[0].logo, null);
  assert.equal(anciens.lieux?.[0].verifie, undefined);
});

test("« Ils ont besoin de toi » : cartes avec logo, SOS et « Non vérifié », puis « Voir les N lieux, sur la carte »", async () => {
  const { lieux } = await listerLieuxAccueil(null);
  const rendre = (nombreLieux: number | null, tirage: boolean) =>
    nettoyer(renderToStaticMarkup(h(MemoryRouter, null, h(IlsOntBesoinDeToi, { lieux, nombreLieux, tirage }))));
  const html = rendre(2791, true);
  assert.match(html, /href="\/lieux"[^>]*>Voir les 2 791 lieux, sur la carte/);
  assert.match(html, /8 lieux tirés au sort chaque jour/);
  assert.match(html, new RegExp(`<img src="${LOGO}" alt=""`));
  assert.match(html, /SOS ce soir · 1 place</);
  assert.match(html, /Non vérifié/);
  assert.match(html, /✓ Vérifié/);
  assert.doesNotMatch(html, /🍷/);
  assert.doesNotMatch(html, /aria-pressed/, "les filtres attendent JavaScript");
  const sansNombre = rendre(null, false);
  assert.match(sansNombre, /href="\/lieux"[^>]*>Voir tous les lieux/);
  assert.doesNotMatch(sansNombre, /tirés au sort/);
});

test("plan du site : /lieux est proposé aux moteurs de recherche", async () => {
  assert.ok(pagesIndexees.includes("/lieux"));
  const reponse = await chargerPlan({ request: new Request("https://sosmiam.fr/sitemap.xml"), params: {} } as never);
  assert.match(await reponse.text(), /<loc>https:\/\/sosmiam\.fr\/lieux<\/loc>/);
});
