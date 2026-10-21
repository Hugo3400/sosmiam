import assert from "node:assert/strict";
import { test } from "node:test";

import { enregistrerProfilLocal, lireProfilLocal } from "~/stockage/profil-local";
import { enregistrerJetonSession, lireJetonSession } from "~/stockage/session-compte";
import * as D from "./banc/donnees.mjs";

test("une connexion écrite pendant la vérification de la réinstallation n'est jamais effacée par elle", async () => {
  D.remplirCoffre();
  D.remplirMagasin();
  globalThis.__delaiMagasin = 20;

  const lecture = lireJetonSession();
  await Promise.all([enregistrerJetonSession(D.JETON_NEUF), enregistrerProfilLocal({ ...D.PROFIL_D_AVANT, prenom: "Sam" })]);
  assert.equal(await lecture, null);
  assert.equal(await lireJetonSession(), D.JETON_NEUF);
  assert.equal((await lireProfilLocal())?.prenom, "Sam");
});
