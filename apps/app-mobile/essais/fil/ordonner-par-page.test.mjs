import assert from "node:assert/strict";
import { test } from "node:test";

import { TAILLE_PAGE_FIL } from "~/contenus/taille-page-fil";
import { ordonnerParPage } from "~/fonctions/publications/ordonner-par-page";

const inverser = (page) => [...page].reverse();
const suite = (n) => Array.from({ length: n }, (_, i) => i + 1);

test("chaque page est triée à part, dans l'ordre où le serveur les a envoyées", () => {
  assert.deepEqual(ordonnerParPage(suite(5), 2, inverser), [2, 1, 4, 3, 5]);
});

test("la page suivante n'a jamais déplacé ce qui était déjà affiché", () => {
  const premiere = ordonnerParPage(suite(TAILLE_PAGE_FIL), TAILLE_PAGE_FIL, inverser);
  const avecLaSuite = ordonnerParPage(suite(TAILLE_PAGE_FIL * 2 + 3), TAILLE_PAGE_FIL, inverser);
  assert.deepEqual(avecLaSuite.slice(0, TAILLE_PAGE_FIL), premiere);
  assert.equal(avecLaSuite.length, TAILLE_PAGE_FIL * 2 + 3);
});

test("en démo (une seule page sans fin), tout est trié d'un bloc", () => {
  assert.deepEqual(ordonnerParPage(suite(4), Number.POSITIVE_INFINITY, inverser), [4, 3, 2, 1]);
});

test("une page peut rendre moins d'éléments (lieux cachés selon l'âge) sans décaler les autres", () => {
  const sansLesPairs = (page) => page.filter((n) => n % 2 === 1);
  assert.deepEqual(ordonnerParPage(suite(6), 3, sansLesPairs), [1, 3, 5]);
  assert.deepEqual(ordonnerParPage([], 20, inverser), []);
});
