import assert from "node:assert/strict";
import { test } from "node:test";

import { ajouterAnnonceVue } from "~/fonctions/annonces-app/ajouter-annonce-vue";

test("ajoute l'identifiant à la fin", () => {
  assert.deepEqual(ajouterAnnonceVue([], 4, 200), [4]);
  assert.deepEqual(ajouterAnnonceVue([1, 2], 3, 200), [1, 2, 3]);
});

test("pas de doublon : une annonce revue passe à la fin", () => {
  assert.deepEqual(ajouterAnnonceVue([1, 2, 3], 2, 200), [1, 3, 2]);
});

test("plafond : on garde les plus récentes", () => {
  const vues = Array.from({ length: 200 }, (_, i) => i + 1);
  const apres = ajouterAnnonceVue(vues, 201, 200);
  assert.equal(apres.length, 200);
  assert.equal(apres[0], 2);
  assert.equal(apres.at(-1), 201);
});

test("ne modifie pas la liste reçue", () => {
  const vues = Object.freeze([1, 2]);
  assert.deepEqual(ajouterAnnonceVue(vues, 3, 2), [2, 3]);
  assert.deepEqual(vues, [1, 2]);
});
