// Adresse masquée d'Apple : le site et l'app préviennent que le relais d'Apple doit transmettre nos liens. node --test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { estAdresseRelaisApple } from "../src/fonctions/compte/est-adresse-relais-apple.ts";

test("adresse masquée d'Apple reconnue, majuscules et espaces compris ; rien d'autre", () => {
  assert.equal(estAdresseRelaisApple("abc123@privaterelay.appleid.com"), true);
  assert.equal(estAdresseRelaisApple(" ABC@PrivateRelay.AppleID.com "), true);
  assert.equal(estAdresseRelaisApple("zoe@exemple.fr"), false);
  assert.equal(estAdresseRelaisApple("privaterelay.appleid.com@exemple.fr"), false);
  assert.equal(estAdresseRelaisApple("zoe@privaterelay.appleid.com.exemple.fr"), false);
  assert.equal(estAdresseRelaisApple(""), false);
});
