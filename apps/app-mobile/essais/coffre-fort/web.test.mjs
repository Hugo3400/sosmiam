import assert from "node:assert/strict";
import { test } from "node:test";

import * as D from "./banc/donnees.mjs";

test("aperçu web : pas de coffre-fort, rien n'est effacé ni marqué, la session passe par AsyncStorage", async () => {
  globalThis.__plateforme = "web";
  globalThis.__coffre = new Map();
  globalThis.__journalCoffre = [];
  const magasin = D.remplirMagasin();
  magasin.set(D.SESSION, D.JETON_D_AVANT);

  const { lireJetonSession, enregistrerJetonSession } = await import("~/stockage/session-compte");
  assert.equal(await lireJetonSession(), D.JETON_D_AVANT);
  await enregistrerJetonSession(D.JETON_NEUF);
  assert.equal(magasin.get(D.SESSION), D.JETON_NEUF);
  assert.deepEqual(globalThis.__journalCoffre, []);
  assert.equal(magasin.has(D.MARQUE), false);
});
