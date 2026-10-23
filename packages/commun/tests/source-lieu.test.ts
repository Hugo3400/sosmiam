import { test } from "node:test";
import assert from "node:assert/strict";
import { lireSourceLieu } from "../src/fonctions/lieux/lire-source-lieu.ts";

test("lireSourceLieu : trouve l'office ou DATAtourisme dans la note, sans jamais la rendre", () => {
  assert.equal(lireSourceLieu(null), null);
  assert.equal(lireSourceLieu(""), null);
  assert.equal(lireSourceLieu("Proposé par Marie, à rappeler"), null);
  assert.equal(lireSourceLieu("(fiche 12) https://exemple.fr/resto"), null);
  const marseille = lireSourceLieu("(fiche 4521) https://www.marseille-tourisme.com/fr/offres/pompe-boulangerie Prix ESTIMÉ");
  assert.deepEqual(marseille, { nom: "l'office de tourisme de Marseille", site: "marseille-tourisme.com", adresse: "https://www.marseille-tourisme.com", licence: null });
  const paris = lireSourceLieu("(fiche abc) https://data.datatourisme.fr/13/1234-5678");
  assert.equal(paris?.nom, "DATAtourisme");
  assert.equal(paris?.licence?.nom, "Licence Ouverte 2.0");
  assert.equal(lireSourceLieu("(fiche 9) source : https://montpellier-tourisme.fr/a, voir aussi https://www.datatourisme.fr")?.site, "montpellier-tourisme.fr");
  assert.equal(lireSourceLieu("https://faux-montpellier-tourisme.fr.exemple.com/x"), null);
  assert.ok(!("hote" in (lireSourceLieu("https://www.visiterlyon.com/x") ?? {})));
});
