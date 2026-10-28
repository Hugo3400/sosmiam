import assert from "node:assert/strict";
import { test } from "node:test";

import { lireCodeInvitation } from "~/stockage/code-invitation";
import { enregistrerProfilLocal } from "~/stockage/profil-local";
import { enregistrerJetonSession } from "~/stockage/session-compte";
import { poserVerrouAge } from "~/stockage/verrou-age";
import * as D from "./banc/donnees.mjs";

test("chaque écriture du coffre-fort est pour cet appareil seulement (jamais restaurée sur un autre iPhone)", async () => {
  globalThis.__coffre = new Map();
  globalThis.__journalCoffre = [];
  D.remplirMagasin(D.MARQUE_A_JOUR);

  await enregistrerJetonSession(D.JETON_NEUF);
  await enregistrerProfilLocal(D.PROFIL_D_AVANT);
  await lireCodeInvitation();
  await poserVerrouAge(D.VERROU);

  const ecrites = D.ecritures();
  assert.deepEqual(ecrites.map((e) => e.cle).sort(), [D.CODE_INVITATION, D.PROFIL, D.SESSION, D.VERROU_AGE].sort());
  for (const ecriture of ecrites) assert.equal(ecriture.options?.keychainAccessible, D.APPAREIL_SEUL, ecriture.cle);
  assert.equal(globalThis.__magasin.get(D.MARQUE), D.MARQUE_A_JOUR);
});
