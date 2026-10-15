// Test de la règle « un resto dont l'info commence par Bar est un bar » (visite sans compte sans bar ni alcool).
import assert from "node:assert/strict";
import { test } from "node:test";

import { choisirTypeSelonInfo } from "../src/fonctions/lieux/choisir-type-selon-info.ts";

test("« Bar à … » rangé en resto devient un bar ; huîtres, fruits et bistrots restent des restos ; les autres types ne bougent pas", () => {
  for (const info of ["Bar à tapas", "Bar à cocktail", "Bar à bière", "Bar à thème", "Bar à vin", "Bar musical", "Bar lounge", " bar à tapas "]) {
    assert.equal(choisirTypeSelonInfo("resto", info), "bar", info);
  }
  for (const info of ["Bar à huîtres", "Bar à huitres", "Bar à fruits", "Bistrot - Bar à vin", "Barbecue coréen", "Brasserie", ""]) {
    assert.equal(choisirTypeSelonInfo("resto", info), "resto", info);
  }
  assert.equal(choisirTypeSelonInfo("sortie", "Bar dansant"), "sortie");
  assert.equal(choisirTypeSelonInfo("patisserie", "Bar à desserts"), "patisserie");
});
