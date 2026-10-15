import { test } from "node:test";
import assert from "node:assert/strict";

import { detecterChangementVisible } from "../src/fonctions/comptes/detecter-changement-visible.ts";

const actuel = { prenom: "Zoé", pseudo: "zoe_m", avatar: "miami:toque" };

test("compte limité : un Miami renvoyé tel quel ne change rien, un autre Miami ou un emoji si", () => {
  assert.equal(detecterChangementVisible({ avatar: "miami:toque" }, actuel), false);
  assert.equal(detecterChangementVisible({ prenom: "Zoé", pseudo: "zoe_m", avatar: "miami:toque" }, actuel), false);
  assert.equal(detecterChangementVisible({ avatar: "miami:raclette" }, actuel), true);
  assert.equal(detecterChangementVisible({ avatar: "🦊" }, actuel), true);
  assert.equal(detecterChangementVisible({ avatar: "miami:toque" }, { ...actuel, avatar: "🦊" }), true);
});

test("compte limité : retirer son Miami (null) reste permis", () => {
  assert.equal(detecterChangementVisible({ avatar: null }, actuel), false);
});
