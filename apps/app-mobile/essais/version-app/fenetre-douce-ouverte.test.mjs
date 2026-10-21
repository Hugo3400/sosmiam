import assert from "node:assert/strict";
import { test } from "node:test";

import { ecouterFenetreDouce, estFenetreDouceLibre, lireFenetreDouce, prendreFenetreDouce, rendreFenetreDouce } from "~/services/fenetre-douce-ouverte";

test("une seule fenêtre douce à la fois : l'autre attend", () => {
  assert.equal(lireFenetreDouce(), null);
  assert.equal(prendreFenetreDouce("nouvelle-version"), true);
  assert.equal(estFenetreDouceLibre("annonce-app"), false);
  assert.equal(prendreFenetreDouce("annonce-app"), false);
  assert.equal(prendreFenetreDouce("nouvelle-version"), true);
  rendreFenetreDouce("annonce-app");
  assert.equal(lireFenetreDouce(), "nouvelle-version");
  rendreFenetreDouce("nouvelle-version");
  assert.equal(lireFenetreDouce(), null);
  assert.equal(prendreFenetreDouce("annonce-app"), true);
  assert.equal(prendreFenetreDouce("nouvelle-version"), false);
  rendreFenetreDouce("annonce-app");
  assert.equal(estFenetreDouceLibre("nouvelle-version"), true);
});

test("les écouteurs sont prévenus à chaque changement, et une erreur chez l'un ne gêne pas les autres", () => {
  const vus = [];
  const arreterCasse = ecouterFenetreDouce(() => {
    throw new Error("casse");
  });
  const arreter = ecouterFenetreDouce(() => vus.push(lireFenetreDouce()));
  prendreFenetreDouce("annonce-app");
  prendreFenetreDouce("annonce-app");
  rendreFenetreDouce("annonce-app");
  rendreFenetreDouce("annonce-app");
  arreter();
  arreterCasse();
  prendreFenetreDouce("nouvelle-version");
  rendreFenetreDouce("nouvelle-version");
  assert.deepEqual(vus, ["annonce-app", null]);
});
