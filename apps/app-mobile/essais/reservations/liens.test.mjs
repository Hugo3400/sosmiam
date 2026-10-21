import assert from "node:assert/strict";
import { test } from "node:test";

import { estLienPermis } from "~/fonctions/notifications/est-lien-permis";

test("une notification de réponse du lieu peut ouvrir Mes réservations", () => {
  assert.equal(estLienPermis("/reservations"), true);
});

test("seulement l'écran lui-même : pas d'adresse inventée autour", () => {
  for (const lien of ["/reservations/", "/reservations/12", "/reservations?x=1", "//reservations", "https://exemple.fr/reservations", " /reservations"]) {
    assert.equal(estLienPermis(lien), false, lien);
  }
});

test("une notification « nouvelle table » ouvre l'onglet Réservations du mode pro, rien d'autre", () => {
  assert.equal(estLienPermis("/pro/reservations"), true);
  for (const lien of ["/pro/reservations/", "/pro/reservations/12", "/pro/reservations?lieu=18", "/pro/reglages-reservations"]) {
    assert.equal(estLienPermis(lien), false, lien);
  }
});
