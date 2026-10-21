import assert from "node:assert/strict";
import { test } from "node:test";

import { lireCodeInvitation } from "~/stockage/code-invitation";
import { lireCompteDeCote } from "~/stockage/compte-de-cote";
import { lireProfilLocal } from "~/stockage/profil-local";
import { lireJetonSession } from "~/stockage/session-compte";
import * as D from "./banc/donnees.mjs";

test("lancement ordinaire (marque à jour) : rien n'est effacé, la session et le reste sont relus, la marque lue une seule fois", async () => {
  D.remplirCoffre();
  const magasin = D.remplirMagasin(D.MARQUE_A_JOUR);
  globalThis.__delaiMagasin = 5;

  const [jeton, profil, deCote, code] = await Promise.all([lireJetonSession(), lireProfilLocal(), lireCompteDeCote(), lireCodeInvitation()]);
  assert.equal(jeton, D.JETON_D_AVANT);
  assert.deepEqual(profil, D.PROFIL_D_AVANT);
  assert.deepEqual(deCote, { jeton: D.JETON_D_AVANT, email: "lea@exemple.fr" });
  assert.equal(code, D.CODE_D_AVANT);
  assert.deepEqual(D.effacements(), []);
  assert.deepEqual(D.ecritures(), []);
  assert.equal(globalThis.__journalMagasin.filter((e) => e.cle === D.MARQUE).length, 1);
  assert.equal(magasin.get(D.MARQUE), D.MARQUE_A_JOUR);
});

test("relancer encore et encore ne déconnecte jamais : la marque à jour n'est jamais réécrite", async () => {
  for (let i = 0; i < 5; i += 1) assert.equal(await lireJetonSession(), D.JETON_D_AVANT);
  assert.deepEqual(D.effacements(), []);
  assert.equal(globalThis.__journalMagasin.filter((e) => e.operation === "ecrire").length, 0);
});
