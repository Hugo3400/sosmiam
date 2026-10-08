// Tests des petites fonctions de texte de l'API.
import assert from "node:assert/strict";
import { test } from "node:test";

import { lireLigneCsv } from "../src/fonctions/texte/lire-ligne-csv.ts";
import { formaterOctets } from "../src/fonctions/texte/formater-octets.ts";

test("une ligne de CSV est découpée, guillemets compris", () => {
  assert.deepEqual(lireLigneCsv('a@b.fr;"Sète; Hérault";"il dit ""oui""";'), ["a@b.fr", "Sète; Hérault", 'il dit "oui"', ""]);
  assert.deepEqual(lireLigneCsv("adresse;ville"), ["adresse", "ville"]);
});

test("les tailles sont lisibles", () => {
  assert.equal(formaterOctets(31416), "30,7 Ko");
});
