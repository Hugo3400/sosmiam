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
