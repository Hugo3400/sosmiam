import { test } from "node:test";
import assert from "node:assert/strict";
import { ENGAGEMENTS_CHARTE_MIAM_SAFE } from "../src/contenus/charte-miam-safe.ts";
import { MESSAGES_SERVICE } from "../src/contenus/messages-services.ts";
import { calculerRepereSentiBien } from "../src/fonctions/miam-safe/calculer-repere-senti-bien.ts";
import { PHRASE_MIAM_SAFE } from "../src/regles/miam-safe.ts";

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

test("charte Miam Safe : quatre engagements, et la phrase est celle des règles", () => {
  assert.equal(ENGAGEMENTS_CHARTE_MIAM_SAFE.length, 4);
  assert.ok(ENGAGEMENTS_CHARTE_MIAM_SAFE[0].texte.includes(`« ${PHRASE_MIAM_SAFE} »`));
  for (const e of ENGAGEMENTS_CHARTE_MIAM_SAFE) assert.ok(e.titre.length > 0 && e.texte.length > 0);
});

test("Miam Safe : « visite-requise » a son texte", () => {
  assert.equal(MESSAGES_SERVICE["visite-requise"].titre, "Après une visite seulement");
});
