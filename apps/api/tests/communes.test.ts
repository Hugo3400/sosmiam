// Tests de la recherche de communes et du fichier src/donnees/communes.json (sans base ni réseau).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { chargerIndexCommunes } from "../src/fonctions/geo/charger-index-communes.ts";
import { chercherCommunes } from "../src/fonctions/geo/chercher-communes.ts";
import type { DonneesCommunes } from "../src/fonctions/geo/indexer-communes.ts";
import { normaliserNomCommune } from "../src/fonctions/geo/normaliser-nom-commune.ts";
import { trouverCommuneParCode } from "../src/fonctions/geo/trouver-commune-par-code.ts";

const donnees = JSON.parse(readFileSync(new URL("../src/donnees/communes.json", import.meta.url), "utf8")) as DonneesCommunes;
const noms = (texte: string, limite?: number) => chercherCommunes(texte, limite).map((commune) => `${commune.nom} (${commune.codeDepartement})`);
const codes = (texte: string, limite?: number) => chercherCommunes(texte, limite).map((commune) => commune.code);

test("la forme de recherche oublie accents, majuscules, tirets, apostrophes et « e » des numéros", () => {
  assert.equal(normaliserNomCommune("Saint-Étienne-du-Rouvray"), "saint etienne du rouvray");
  assert.equal(normaliserNomCommune("  L'Haÿ-les-Roses "), "l hay les roses");
  assert.equal(normaliserNomCommune("ŒUILLY"), "oeuilly");
  assert.equal(normaliserNomCommune("Paris 11e Arrondissement"), "paris 11 arrondissement");
  assert.equal(normaliserNomCommune("Lyon 1er"), "lyon 1");
  assert.equal(normaliserNomCommune("Paris 11ème"), "paris 11");
  assert.equal(normaliserNomCommune("—'·"), "");
});

test("accents, majuscules et tirets ne comptent pas", () => {
  for (const texte of ["saint etienne", "SAINT-ÉTIENNE", "Saint Etienne", "saint–étienne"]) assert.equal(codes(texte)[0], "42218");
  assert.deepEqual(noms("BEZIERS", 1), ["Béziers (34)"]);
  assert.deepEqual(noms("orleans", 1), ["Orléans (45)"]);
  assert.deepEqual(noms("lhay"), ["L'Haÿ-les-Roses (94)"]);
  assert.deepEqual(noms("villeneuve d ascq"), ["Villeneuve-d'Ascq (59)"]);
  assert.deepEqual(noms("noumea"), ["Nouméa (988)"]);
});

test("« st » et « ste » valent « saint » et « sainte », sans cacher les noms qui commencent par « St »", () => {
  assert.equal(codes("st etienne")[0], "42218");
  assert.equal(codes("St-Étienne")[0], "42218");
  assert.deepEqual(noms("Ste Maxime"), ["Sainte-Maxime (83)"]);
  assert.deepEqual(noms("ste genevieve des bois", 1), ["Sainte-Geneviève-des-Bois (91)"]);
  assert.ok(noms("st").includes("Strasbourg (67)"));
  assert.ok(noms("st").includes("Saint-Étienne (42)"));
});

test("un code postal à 5 chiffres donne ses communes, la plus peuplée d'abord, avec le code postal qui a servi", () => {
  const resultats = chercherCommunes("01400", 20);
  assert.equal(resultats.length, 10);
  assert.equal(resultats[0].nom, "Châtillon-sur-Chalaronne");
  assert.ok(resultats.every((commune, rang) => commune.codePostal === "01400" && (rang === 0 || resultats[rang - 1].population >= commune.population)));
  assert.equal(chercherCommunes("01400").length, 8);
  assert.deepEqual(noms("34170"), ["Castelnau-le-Lez (34)"]);
  assert.deepEqual(noms("75 011"), ["Paris (75)"]);
  assert.deepEqual(noms("97133"), ["Saint-Barthélemy (977)"]);
  assert.deepEqual(chercherCommunes("00000"), []);
  assert.equal(chercherCommunes("Lyon")[0].codePostal, null);
});

test("le nom entier passe avant son début, qui passe avant le milieu ; à égalité, la plus peuplée d'abord", () => {
  assert.deepEqual(noms("nant", 3), ["Nant (12)", "Nantes (44)", "Nanterre (92)"]);
  assert.deepEqual(noms("denis", 4), ["Saint-Denis (974)", "Saint-Denis (93)", "Vert-Saint-Denis (77)", "L'Île-Saint-Denis (93)"]);
  assert.deepEqual(noms("orleans"), ["Orléans (45)", "Forléans (21)"]);
  assert.deepEqual(noms("sur mer", 3), ["La Seyne-sur-Mer (83)", "Cagnes-sur-Mer (06)", "Boulogne-sur-Mer (62)"]);
});

test("le nom compte aussi sans son article : « Mans » trouve Le Mans avant Mansle", () => {
  assert.equal(noms("mans")[0], "Le Mans (72)");
  assert.equal(noms("havre")[0], "Le Havre (76)");
  assert.equal(noms("abymes")[0], "Les Abymes (971)");
  assert.equal(noms("le havre")[0], "Le Havre (76)");
});

test("« Lyon 3 » ou « Paris 11 » trouvent l'arrondissement, rendu comme sa commune", () => {
  for (const texte of ["Lyon 3", "lyon 3e", "Lyon 3eme"]) assert.deepEqual(codes(texte), ["69123"]);
  for (const texte of ["Paris 11", "paris 11ème", "Paris 1er"]) assert.deepEqual(codes(texte), ["75056"]);
  assert.deepEqual(codes("Marseille 13"), ["13055"]);
  assert.equal(trouverCommuneParCode("69383")?.code, "69123");
  assert.equal(trouverCommuneParCode("75111")?.nom, "Paris");
  assert.equal(trouverCommuneParCode("98411"), null);
  assert.equal(trouverCommuneParCode("55050"), null);
});

test("les homonymes sortent tous, chacun avec son département", () => {
  const saintDenis = chercherCommunes("Saint-Denis").filter((commune) => commune.nom === "Saint-Denis");
  assert.deepEqual(
    saintDenis.map((commune) => [commune.code, commune.nomDepartement]),
    [["97411", "La Réunion"], ["93066", "Seine-Saint-Denis"], ["11339", "Aude"], ["30247", "Gard"]],
  );
  assert.deepEqual(chercherCommunes("rochelle").map((commune) => commune.nomDepartement), ["Charente-Maritime", "Haute-Saône"]);
});

test("chaque résultat donne code, nom, département, population et code postal", () => {
  const [lyon] = chercherCommunes("Lyon", 1);
  assert.deepEqual(Object.keys(lyon), ["code", "nom", "nomDepartement", "codeDepartement", "population", "codePostal"]);
  assert.deepEqual({ ...lyon, population: 0 }, { code: "69123", nom: "Lyon", nomDepartement: "Rhône", codeDepartement: "69", population: 0, codePostal: null });
  assert.ok(lyon.population > 500_000);
  assert.equal(chercherCommunes("papeete")[0].nomDepartement, "Polynésie française");
});

test("limite : 8 par défaut, 20 au plus, 1 au moins", () => {
  assert.equal(chercherCommunes("saint").length, 8);
  assert.equal(chercherCommunes("saint", 3).length, 3);
  assert.equal(chercherCommunes("saint", 50).length, 20);
  assert.equal(chercherCommunes("saint", 0).length, 1);
  assert.equal(chercherCommunes("saint", Number.NaN).length, 8);
  assert.equal(new Set(codes("paris", 20)).size, codes("paris", 20).length);
});

test("texte vide, sans lettres ni chiffres, ou de plus de 80 caractères : liste vide", () => {
  for (const texte of ["", "   ", "-'", "a".repeat(81), "zzzz", "11", "arrondissement"]) assert.deepEqual(chercherCommunes(texte), []);
  assert.equal(chercherCommunes("Saint-Remy-en-Bouzemont-Saint-Genest-et-Isson".padEnd(80))[0]?.code, "51513");
  assert.deepEqual(chercherCommunes(undefined as unknown as string), []);
});

test("une recherche prend moins de 5 ms (index préparé une fois)", () => {
  chargerIndexCommunes();
  const textes = ["s", "l", "saint", "st", "ste", "lyon 3", "paris", "75011", "mar", "ville", "aix", "zzz", "denis", "sur mer", "e"];
  const debut = performance.now();
  for (let tour = 0; tour < 20; tour++) for (const texte of textes) chercherCommunes(texte, 20);
  const moyenne = (performance.now() - debut) / (20 * textes.length);
  assert.ok(moyenne < 5, `${moyenne.toFixed(2)} ms par recherche`);
});

test("fichier des communes : habitées, sans 984 ni 989, sans code en double", () => {
  const departements = Object.keys(donnees.departements);
  assert.equal(departements.length, 107);
  assert.ok(!departements.includes("984") && !departements.includes("989"));
  for (const code of ["75", "2A", "2B", "971", "976", "975", "977", "978", "986", "987", "988"]) assert.ok(departements.includes(code), code);
  const vus = new Set<string>();
  for (const [code, nom, codeDepartement, population, codesPostaux] of donnees.communes) {
    assert.ok(!vus.has(code), `${code} en double`);
    vus.add(code);
    assert.ok(nom && departements.includes(codeDepartement), code);
    assert.ok(code.startsWith(codeDepartement), code);
    assert.ok(Number.isInteger(population) && population > 0, `${code} sans habitants`);
    assert.ok(codesPostaux.length > 0 && codesPostaux.every((codePostal) => /^\d{5}$/.test(codePostal)), code);
  }
  assert.ok(donnees.communes.length > 34_000);
  assert.equal(donnees.arrondissements.length, 45);
  for (const [code, , codeCommune] of donnees.arrondissements) {
    assert.ok(!vus.has(code), `${code} en double`);
    vus.add(code);
    assert.ok(["75056", "69123", "13055"].includes(codeCommune), code);
  }
  assert.match(donnees.telechargeLe, /^\d{4}-\d{2}-\d{2}$/);
});
