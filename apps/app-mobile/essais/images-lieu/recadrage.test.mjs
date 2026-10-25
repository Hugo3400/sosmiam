import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerRecadrageCentre } from "~/fonctions/photos/calculer-recadrage-centre";

const BANNIERE = 1600 / 500;

test("bannière : une photo plus haute que large est coupée en haut et en bas, au centre", () => {
  assert.deepEqual(calculerRecadrageCentre(3000, 4000, BANNIERE), { originX: 0, originY: 1531, width: 3000, height: 938 });
});

test("bannière : une photo plus large que 16:5 est coupée sur les côtés, au centre", () => {
  assert.deepEqual(calculerRecadrageCentre(5000, 1000, BANNIERE), { originX: 900, originY: 0, width: 3200, height: 1000 });
});

test("logo : le plus grand carré au centre, et rien ne sort jamais de la photo", () => {
  assert.deepEqual(calculerRecadrageCentre(4032, 3024, 1), { originX: 504, originY: 0, width: 3024, height: 3024 });
  assert.deepEqual(calculerRecadrageCentre(512, 512, 1), { originX: 0, originY: 0, width: 512, height: 512 });
  for (const [l, h, r] of [[1, 1, BANNIERE], [3, 7, 1], [1599, 500, BANNIERE], [1601, 500, BANNIERE], [7, 2, BANNIERE], [10000, 3, 1]]) {
    const c = calculerRecadrageCentre(l, h, r);
    assert.ok(c.width >= 1 && c.height >= 1, `${l}×${h}`);
    assert.ok(c.originX >= 0 && c.originY >= 0 && c.originX + c.width <= l && c.originY + c.height <= h, `${l}×${h}`);
  }
});
