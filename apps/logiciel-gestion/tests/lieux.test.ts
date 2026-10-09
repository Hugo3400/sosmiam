// Tests des filtres de la liste des lieux : type, catégorie (« Ce que c'est ») et comptage des catégories.
import assert from "node:assert/strict";
import { test } from "node:test";

import { compterValeursLieux } from "../src/fonctions/lieux/compter-valeurs-lieux.ts";
import { filtrerLieux } from "../src/fonctions/lieux/filtrer-lieux.ts";
import type { ResumeLieu } from "../src/services/lieux.ts";

const lieux: (Pick<ResumeLieu, "type" | "info" | "ville"> & { id: number })[] = [
  { id: 1, type: "resto", info: "Bar à tapas", ville: "Montpellier" },
  { id: 2, type: "resto", info: "Brasserie", ville: "Saint-Jean-de-Védas" },
  { id: 3, type: "resto", info: "bar a tapas ", ville: "montpellier" },
  { id: 4, type: "bar", info: "Bar à cocktail", ville: "Sète" },
  { id: 5, type: "resto", info: "", ville: "" },
  { id: 6, type: "resto", info: "Brasserie", ville: "Montpellier" },
  { id: 7, type: "resto", info: "Bar à tapas", ville: "Lattes" },
];

test("filtre par type et par catégorie, sans tenir compte des majuscules, accents ni espaces", () => {
  assert.deepEqual(filtrerLieux(lieux, { type: "bar", categorie: "", ville: "" }).map((l) => l.id), [4]);
  assert.deepEqual(filtrerLieux(lieux, { type: "", categorie: "Bar à tapas", ville: "" }).map((l) => l.id), [1, 3, 7]);
  assert.deepEqual(filtrerLieux(lieux, { type: "bar", categorie: "Bar à tapas", ville: "" }).map((l) => l.id), []);
  assert.equal(filtrerLieux(lieux, { type: "", categorie: "", ville: "" }).length, lieux.length);
  assert.deepEqual(filtrerLieux(lieux, { type: "", categorie: "", ville: "Montpellier" }).map((l) => l.id), [1, 3, 6]);
  assert.deepEqual(filtrerLieux(lieux, { type: "", categorie: "", ville: "saint jean de vedas" }).map((l) => l.id), [2]);
  assert.deepEqual(filtrerLieux(lieux, { type: "resto", categorie: "Bar à tapas", ville: "Montpellier" }).map((l) => l.id), [1, 3]);
});

test("catégories et villes comptées : les plus fréquentes d'abord, écritures voisines ensemble, sans les vides", () => {
  assert.deepEqual(compterValeursLieux(lieux, "ville"), [
    { libelle: "Montpellier", nombre: 3 },
    { libelle: "Lattes", nombre: 1 },
    { libelle: "Saint-Jean-de-Védas", nombre: 1 },
    { libelle: "Sète", nombre: 1 },
  ]);
  // La valeur choisie reste dans la liste, même sans lieu
  assert.deepEqual(compterValeursLieux([], "ville", "Sète"), [{ libelle: "Sète", nombre: 0 }]);
  assert.deepEqual(compterValeursLieux(lieux, "info"), [
    { libelle: "Bar à tapas", nombre: 3 },
    { libelle: "Brasserie", nombre: 2 },
    { libelle: "Bar à cocktail", nombre: 1 },
  ]);
});
