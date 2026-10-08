// Tests des zones des fondateurs (décision « Fondateurs par ville » du 9 octobre 2026) : places, code de zone, nom avec
// « de », construction des zones, et totaux tirés du vrai fichier des communes (sans base ni réseau).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { calculerCodeZone } from "../src/fonctions/fondateurs/calculer-code-zone.ts";
import { calculerPlacesVille } from "../src/fonctions/fondateurs/calculer-places-ville.ts";
import { construireZonesFondateurs } from "../src/fonctions/fondateurs/construire-zones-fondateurs.ts";
import { ecrireNomAvecDe } from "../src/fonctions/fondateurs/ecrire-nom-avec-de.ts";
import type { DonneesCommunes } from "../src/fonctions/geo/indexer-communes.ts";
import { trouverCommuneParCode } from "../src/fonctions/geo/trouver-commune-par-code.ts";

test("places d'une ville : 10, 5, 3 ou 1, seuils pile compris", () => {
  const cas = [[2_103_778, 10], [500_000, 10], [499_999, 5], [200_000, 5], [199_999, 3], [100_000, 3], [99_999, 1], [50_000, 1], [49_999, 0], [0, 0]];
  for (const [population, places] of cas) assert.equal(calculerPlacesVille(population), places, `${population} habitants`);
});

test("code de zone : la commune elle-même dès 50 000 habitants pile, sinon « D » et son département", () => {
  const commune = (population: number) => ({ code: "12202", codeDepartement: "12", population });
  for (const population of [500_000, 200_000, 100_000, 50_000]) assert.equal(calculerCodeZone(commune(population)), "12202");
  assert.equal(calculerCodeZone(commune(49_999)), "D12");
  assert.equal(calculerCodeZone({ code: "2A001", codeDepartement: "2A", population: 3_350 }), "D2A");
});

test("code de zone des vraies communes : Paris, Lyon, une petite commune, l'outre-mer, Nouméa", () => {
  const zone = (code: string) => {
    const commune = trouverCommuneParCode(code);
    assert.ok(commune, code);
    return calculerCodeZone(commune);
  };
  assert.equal(zone("75056"), "75056"); // Paris
  assert.equal(zone("75111"), "75056"); // Paris 11e Arrondissement
  assert.equal(zone("69123"), "69123"); // Lyon
  assert.equal(zone("69383"), "69123"); // Lyon 3e Arrondissement
  assert.equal(zone("01001"), "D01"); // L'Abergement-Clémenciat, 860 habitants
  assert.equal(zone("2A004"), "2A004"); // Ajaccio
  assert.equal(zone("2A001"), "D2A"); // Afa
  assert.equal(zone("97611"), "97611"); // Mamoudzou
  assert.equal(zone("98818"), "98818"); // Nouméa : sa propre zone…
  assert.equal(zone("98817"), "D988"); // … et Le Mont-Dore dans celle de la Nouvelle-Calédonie
  assert.equal(zone("98735"), "D987"); // Papeete
  assert.equal(zone("97701"), "D977"); // Saint-Barthélemy
  assert.equal(zone("97801"), "D978"); // Saint-Martin
  assert.equal(zone("97502"), "D975"); // Saint-Pierre
  assert.equal(zone("98613"), "D986"); // Uvea, Wallis-et-Futuna
});

test("nom avec « de » : article officiel de l'Insee, avec majuscule seulement s'il fait partie du nom", () => {
  assert.equal(ecrireNomAvecDe("Lyon", 0, true), "de Lyon");
  assert.equal(ecrireNomAvecDe("Angers", 1, true), "d'Angers");
  assert.equal(ecrireNomAvecDe("Havre", 2, true), "du Havre");
  assert.equal(ecrireNomAvecDe("Rochelle", 3, true), "de La Rochelle");
  assert.equal(ecrireNomAvecDe("Abymes", 4, true), "des Abymes");
  assert.equal(ecrireNomAvecDe("Haÿ-les-Roses", 5, true), "de L'Haÿ-les-Roses");
  assert.equal(ecrireNomAvecDe("Creuse", 3, false), "de la Creuse");
  assert.equal(ecrireNomAvecDe("Landes", 4, false), "des Landes");
  assert.equal(ecrireNomAvecDe("Ain", 5, false), "de l'Ain");
  assert.equal(ecrireNomAvecDe("Rhône", 2, false), "du Rhône");
  assert.equal(ecrireNomAvecDe("Ille-et-Vilaine", 1, false), "d'Ille-et-Vilaine");
  assert.equal(ecrireNomAvecDe("La Réunion", 0, false), "de La Réunion");
  assert.equal(ecrireNomAvecDe("Polynésie française", 0, false), "de Polynésie française");
  assert.throws(() => ecrireNomAvecDe("Nulle-Part", 9, false), /TNCC 9/);
});

const departements = [
  { code: "69", nom: "Rhône", nomSansArticle: "Rhône", tncc: 2, codeRegion: "84" },
  { code: "75", nom: "Paris", nomSansArticle: "Paris", tncc: 0, codeRegion: "11" },
  { code: "76", nom: "Seine-Maritime", nomSansArticle: "Seine-Maritime", tncc: 3, codeRegion: "28" },
  { code: "93", nom: "Seine-Saint-Denis", nomSansArticle: "Seine-Saint-Denis", tncc: 3, codeRegion: "11" },
  { code: "974", nom: "La Réunion", nomSansArticle: "La Réunion", tncc: 0, codeRegion: "04" },
  { code: "988", nom: "Nouvelle-Calédonie", nomSansArticle: "Nouvelle-Calédonie", tncc: 0, codeRegion: null },
];
const communes = [
  { code: "75056", nom: "Paris", codeDepartement: "75", population: 2_103_778 },
  { code: "69123", nom: "Lyon", codeDepartement: "69", population: 500_000 },
  { code: "69266", nom: "Villeurbanne", codeDepartement: "69", population: 100_000 },
  { code: "69001", nom: "Affoux", codeDepartement: "69", population: 400 },
  { code: "69002", nom: "Aigueperse", codeDepartement: "69", population: 49_999 },
  { code: "76351", nom: "Le Havre", codeDepartement: "76", population: 166_687 },
  { code: "93066", nom: "Saint-Denis", codeDepartement: "93", population: 149_077 },
  { code: "93001", nom: "Aubervilliers", codeDepartement: "93", population: 49_000 },
  { code: "97411", nom: "Saint-Denis", codeDepartement: "974", population: 155_634 },
  { code: "97401", nom: "Les Avirons", codeDepartement: "974", population: 11_000 },
  { code: "98818", nom: "Nouméa", codeDepartement: "988", population: 50_000 },
  { code: "98817", nom: "Le Mont-Dore", codeDepartement: "988", population: 25_303 },
];
const nomsInsee = new Map(communes.map((commune) => [commune.code, { nomSansArticle: commune.nom, tncc: 0 }]));
nomsInsee.set("76351", { nomSansArticle: "Havre", tncc: 2 });

test("zones : une par ville de 50 000 habitants ou plus, une par département pour le reste, homonymes distincts", () => {
  const zones = construireZonesFondateurs({ communes, departements, nomsInsee });
  assert.deepEqual(
    zones.map((zone) => [zone.code, zone.nom, zone.places]),
    [
      ["75056", "Paris", 10],
      ["69123", "Lyon", 10],
      ["76351", "Le Havre", 3],
      ["97411", "Saint-Denis (La Réunion)", 3],
      ["93066", "Saint-Denis (Seine-Saint-Denis)", 3],
      ["69266", "Villeurbanne", 3],
      ["98818", "Nouméa", 1],
      ["D69", "Rhône", 1],
      ["D93", "Seine-Saint-Denis", 1],
      ["D974", "La Réunion", 1],
      ["D988", "Nouvelle-Calédonie", 1],
    ],
  );
  const parCode = new Map(zones.map((zone) => [zone.code, zone]));
  assert.deepEqual(parCode.get("D69"), { code: "D69", type: "departement", nom: "Rhône", nomAvecDe: "du Rhône", codeDepartement: "69", codeRegion: "84", population: 50_399, places: 1 });
  assert.deepEqual(parCode.get("98818"), { code: "98818", type: "ville", nom: "Nouméa", nomAvecDe: "de Nouméa", codeDepartement: "988", codeRegion: null, population: 50_000, places: 1 });
  assert.equal(parCode.get("D988")?.codeRegion, null);
  assert.equal(parCode.get("D988")?.population, 25_303);
  assert.equal(parCode.get("76351")?.nomAvecDe, "du Havre");
  assert.equal(parCode.get("97411")?.nomAvecDe, "de Saint-Denis");
  assert.equal(parCode.get("D93")?.nomAvecDe, "de la Seine-Saint-Denis");
  assert.ok(!parCode.has("D75") && !parCode.has("D76"), "pas de zone de département sans petite commune (Paris)");
});

test("zones : erreur claire si une ville manque au COG, si un département est inconnu ou si deux zones ont le même nom", () => {
  assert.throws(() => construireZonesFondateurs({ communes, departements, nomsInsee: new Map() }), /Paris \(75056\) absente du Code officiel géographique/);
  assert.throws(() => construireZonesFondateurs({ communes, departements: departements.slice(1), nomsInsee }), /Département 69 inconnu/);
  const homonymes = [...departements, { code: "77", nom: "Seine-Maritime", nomSansArticle: "Seine-Maritime", tncc: 0, codeRegion: "11" }];
  const petites = [...communes, { code: "77001", nom: "Achères-la-Forêt", codeDepartement: "77", population: 1_200 }, { code: "76001", nom: "Allouville-Bellefosse", codeDepartement: "76", population: 1_000 }];
  assert.throws(() => construireZonesFondateurs({ communes: petites, departements: homonymes, nomsInsee }), /Deux zones portent le nom « Seine-Maritime »/);
});

test("vraies données : 241 zones et 367 places, comme la décision du 9 octobre 2026", () => {
  // À revoir avec docs/decisions.md si les populations changent les totaux (npm run api:communes, chaque année).
  const donnees = JSON.parse(readFileSync(new URL("../src/donnees/communes.json", import.meta.url), "utf8")) as DonneesCommunes;
  const places = new Map<string, number>();
  for (const [code, , codeDepartement, population] of donnees.communes) {
    const zone = calculerCodeZone({ code, codeDepartement, population });
    places.set(zone, zone.startsWith("D") ? 1 : calculerPlacesVille(population));
  }
  const villes = [...places].filter(([code]) => !code.startsWith("D"));
  const collectivites = [...places.keys()].filter((code) => ["D975", "D977", "D978", "D986", "D987", "D988"].includes(code));
  const somme = (liste: number[]) => liste.reduce((total, nombre) => total + nombre, 0);
  assert.equal(places.size, 241);
  assert.equal(villes.length, 135);
  assert.equal(somme(villes.map(([, nombre]) => nombre)), 261);
  assert.equal(places.size - villes.length - collectivites.length, 100);
  assert.equal(collectivites.length, 6);
  assert.equal(somme([...places.values()]), 367);
  assert.ok(!places.has("D75") && !places.has("D984") && !places.has("D989"));
});
