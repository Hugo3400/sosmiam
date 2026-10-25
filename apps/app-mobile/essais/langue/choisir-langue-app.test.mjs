import assert from "node:assert/strict";
import { test } from "node:test";

import { choisirLangueApp } from "~/fonctions/langue/choisir-langue-app";

const FR = ["fr"];
const TOUTES = ["fr", "en"];

test("automatique : la langue du téléphone si elle est ouverte, sinon le français", () => {
  assert.equal(choisirLangueApp("automatique", ["en-GB", "fr-FR"], TOUTES, false), "en");
  assert.equal(choisirLangueApp("automatique", ["es-ES", "en-US"], TOUTES, false), "en");
  assert.equal(choisirLangueApp("automatique", ["de-DE"], TOUTES, false), "fr");
  assert.equal(choisirLangueApp("automatique", [], TOUTES, false), "fr");
  assert.equal(choisirLangueApp("automatique", ["en-GB"], FR, false), "fr");
  assert.equal(choisirLangueApp("automatique", ["en-GB"], FR, true), "fr", "l'aperçu ne change jamais le choix automatique");
});

test("choix à la main : gardé si la langue est ouverte, ou en aperçu (développement)", () => {
  assert.equal(choisirLangueApp("en", ["fr-FR"], TOUTES, false), "en");
  assert.equal(choisirLangueApp("fr", ["en-GB"], TOUTES, false), "fr");
  assert.equal(choisirLangueApp("en", ["fr-FR"], FR, true), "en");
  assert.equal(choisirLangueApp("fr", ["en-GB"], FR, true), "fr");
});

test("choix à la main d'une langue pas encore ouverte, hors aperçu : la règle automatique reprend", () => {
  assert.equal(choisirLangueApp("en", ["en-GB"], FR, false), "fr");
  assert.equal(choisirLangueApp("en", ["fr-FR"], FR, false), "fr");
});
