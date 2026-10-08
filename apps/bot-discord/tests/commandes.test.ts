import assert from "node:assert/strict";
import { test } from "node:test";
import { commandes } from "../src/commandes/liste-commandes.ts";

test("chaque commande produit une définition acceptée par Discord", () => {
  assert.ok(commandes.size > 0);
  for (const [nom, commande] of commandes) {
    // toJSON() valide noms, descriptions et options, comme Discord le fera.
    const definition = commande.definition.toJSON();
    assert.equal(definition.name, nom);
    assert.match(nom, /^[a-z0-9-]{1,32}$/);
    assert.ok(definition.description.length <= 100, `description trop longue : /${nom}`);
  }
});

test("les commandes à autocomplétion savent compléter", () => {
  for (const [nom, commande] of commandes) {
    const options = commande.definition.toJSON().options ?? [];
    const autocompletion = options.some((o) => "autocomplete" in o && o.autocomplete);
    if (autocompletion) assert.ok(commande.completer, `/${nom} n'a pas de fonction completer`);
  }
});
