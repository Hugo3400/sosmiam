import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerMinutesPourModifier } from "~/fonctions/chat/calculer-minutes-pour-modifier";

const MAINTENANT = new Date("2026-10-22T19:20:00.000Z");
const ilYa = (secondes) => new Date(MAINTENANT.getTime() - secondes * 1000).toISOString();

test("« Encore N min pour le corriger » : arrondi au-dessus, 15 au plus", () => {
  assert.equal(calculerMinutesPourModifier(ilYa(0), MAINTENANT), 15);
  assert.equal(calculerMinutesPourModifier(ilYa(30), MAINTENANT), 15);
  assert.equal(calculerMinutesPourModifier(ilYa(60), MAINTENANT), 14);
  assert.equal(calculerMinutesPourModifier(ilYa(14 * 60 + 1), MAINTENANT), 1);
  assert.equal(calculerMinutesPourModifier(ilYa(-120), MAINTENANT), 15);
});

test("passé 15 minutes, ou date illisible : plus rien à corriger", () => {
  assert.equal(calculerMinutesPourModifier(ilYa(15 * 60), MAINTENANT), 0);
  assert.equal(calculerMinutesPourModifier(ilYa(3600), MAINTENANT), 0);
  assert.equal(calculerMinutesPourModifier("pas une date", MAINTENANT), 0);
});
