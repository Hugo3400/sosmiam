import assert from "node:assert/strict";
import { test } from "node:test";

import { lireProfilLocal } from "~/stockage/profil-local";
import { lireJetonSession } from "~/stockage/session-compte";
import * as D from "./banc/donnees.mjs";

test("mise à jour depuis une version d'avant (marque « 1 ») : déconnexion une fois, le profil reste pour que utiliserFinDeSession efface tout et prévienne", async () => {
  const coffre = D.remplirCoffre();
  const magasin = D.remplirMagasin(D.MARQUE_D_AVANT);

  assert.equal(await lireJetonSession(), null);
  assert.deepEqual(await lireProfilLocal(), D.PROFIL_D_AVANT);
  assert.deepEqual(D.effacements(), [D.CODE_INVITATION, D.SESSION].sort());
  assert.equal(magasin.get(D.MARQUE), D.MARQUE_A_JOUR);
  assert.equal(coffre.get(D.VERROU_AGE).valeur, D.VERROU);
});
