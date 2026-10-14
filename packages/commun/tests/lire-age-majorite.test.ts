import { strict as assert } from "node:assert";
import { test } from "node:test";

import { AGE_MINIMUM_INSCRIPTION } from "../src/regles/ages.ts";
import { lireAgeMajorite } from "../src/regles/lire-age-majorite.ts";

test("l'app s'ouvre à la majorité : 18 ans en France, partout", () => {
  assert.equal(AGE_MINIMUM_INSCRIPTION, 18);
  assert.equal(lireAgeMajorite(), 18);
  assert.equal(lireAgeMajorite("fr"), 18);
});

test("un pays absent de la table n'est pas ouvert", () => {
  assert.equal(lireAgeMajorite("ZZ"), null);
  assert.equal(lireAgeMajorite(""), null);
});
