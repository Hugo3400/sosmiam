// Tests des filtres de la liste des lieux : type, catégorie (« Ce que c'est ») et comptage des catégories.
import assert from "node:assert/strict";
import { test } from "node:test";

import { compterCategoriesLieux } from "../src/fonctions/lieux/compter-categories-lieux.ts";
import { filtrerLieux } from "../src/fonctions/lieux/filtrer-lieux.ts";
import type { ResumeLieu } from "../src/services/lieux.ts";

const lieux: (Pick<ResumeLieu, "type" | "info"> & { id: number })[] = [
  { id: 1, type: "resto", info: "Bar à tapas" },
  { id: 2, type: "resto", info: "Brasserie" },
  { id: 3, type: "resto", info: "bar a tapas " },
  { id: 4, type: "bar", info: "Bar à cocktail" },
  { id: 5, type: "resto", info: "" },
  { id: 6, type: "resto", info: "Brasserie" },
  { id: 7, type: "resto", info: "Bar à tapas" },
];

test("filtre par type et par catégorie, sans tenir compte des majuscules, accents ni espaces", () => {
  assert.deepEqual(filtrerLieux(lieux, { type: "bar", categorie: "" }).map((l) => l.id), [4]);
  assert.deepEqual(filtrerLieux(lieux, { type: "", categorie: "Bar à tapas" }).map((l) => l.id), [1, 3, 7]);
  assert.deepEqual(filtrerLieux(lieux, { type: "bar", categorie: "Bar à tapas" }).map((l) => l.id), []);
  assert.equal(filtrerLieux(lieux, { type: "", categorie: "" }).length, lieux.length);
});

test("catégories comptées : les plus fréquentes d'abord, écritures voisines ensemble, sans les vides", () => {
  assert.deepEqual(compterCategoriesLieux(lieux), [
    { libelle: "Bar à tapas", nombre: 3 },
    { libelle: "Brasserie", nombre: 2 },
    { libelle: "Bar à cocktail", nombre: 1 },
  ]);
});
