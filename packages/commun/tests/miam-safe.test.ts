import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerRepereSentiBien } from "../src/fonctions/miam-safe/calculer-repere-senti-bien.ts";

test("repère senti bien : pas avant 20 réponses, même avec 100 % de oui", () => {
  assert.equal(calculerRepereSentiBien(19, 19), false);
});

test("repère senti bien : 90 % de oui sur 20 réponses suffisent", () => {
  assert.equal(calculerRepereSentiBien(18, 20), true);
  assert.equal(calculerRepereSentiBien(17, 20), false);
});

test("repère senti bien : des valeurs absurdes ne l'affichent pas", () => {
  assert.equal(calculerRepereSentiBien(Number.NaN, 40), false);
  assert.equal(calculerRepereSentiBien(30, Number.POSITIVE_INFINITY), false);
});
