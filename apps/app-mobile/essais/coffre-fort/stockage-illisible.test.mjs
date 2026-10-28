import assert from "node:assert/strict";
import { test } from "node:test";

import { lireCodeInvitation } from "~/stockage/code-invitation";
import { lireProfilLocal } from "~/stockage/profil-local";
import { lireJetonSession } from "~/stockage/session-compte";
import * as D from "./banc/donnees.mjs";

test("AsyncStorage illisible (téléphone verrouillé, fichier abîmé) : rien n'est effacé, aucune marque posée, rien n'est rendu", async () => {
  const coffre = D.remplirCoffre();
  D.remplirMagasin(D.MARQUE_D_AVANT);
  globalThis.__magasinIllisible = true;

  assert.equal(await lireJetonSession(), null);
  assert.equal(await lireProfilLocal(), null);
  const code = await lireCodeInvitation();
  assert.notEqual(code, D.CODE_D_AVANT);
  assert.deepEqual(D.effacements(), []);
  assert.deepEqual(D.ecritures(), []);
  assert.equal(coffre.get(D.SESSION).valeur, D.JETON_D_AVANT);
  assert.equal(globalThis.__magasin.get(D.MARQUE), D.MARQUE_D_AVANT);
});

test("le même lancement garde la même réponse : jamais un profil sans session (qui ferait tout effacer)", async () => {
  globalThis.__magasinIllisible = false;
  assert.equal(await lireProfilLocal(), null);
  assert.equal(await lireJetonSession(), null);
  assert.deepEqual(D.effacements(), []);
});
