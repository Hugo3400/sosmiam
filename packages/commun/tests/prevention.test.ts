import { test } from "node:test";
import assert from "node:assert/strict";
import { MESSAGE_SANITAIRE_ALCOOL } from "../src/contenus/prevention-alcool.ts";
import { estRecompenseAlcool } from "../src/fonctions/fidelite/est-recompense-alcool.ts";
import { carteContientAlcool } from "../src/fonctions/prevention/carte-contient-alcool.ts";
import { lieuEvoqueAlcool } from "../src/fonctions/prevention/lieu-evoque-alcool.ts";
import { parleDAlcool } from "../src/fonctions/prevention/parle-d-alcool.ts";

test("Le message sanitaire est la formule de la loi Évin, mot pour mot", () => {
  assert.equal(MESSAGE_SANITAIRE_ALCOOL, "L'abus d'alcool est dangereux pour la santé, à consommer avec modération.");
});

test("parleDAlcool : mots d'alcool et happy hours, pas le reste", () => {
  for (const texte of ["Happy hour jusqu'à 20h", "HAPPY-HOURS du jeudi", "Un verre de Picpoul", "l'apéro sur la terrasse", "2 Bières !", "Cocktails maison à 8 €"]) {
    assert.equal(parleDAlcool(texte), true, texte);
  }
  // Pluriels, alcools moins courants et « verre » (relevés à la relecture)
  for (const texte of ["Un verre offert", "2 pintes pour le prix d'une", "Apéros à 5 €", "Mojitos à 6 €", "Kirs offerts", "Digestifs offerts", "Cognac", "Caipirinha", "Une IPA offerte"]) {
    assert.equal(parleDAlcool(texte), true, texte);
  }
  for (const texte of ["Salle calme ce soir", "Fournée du soir à -30 %", "Vinaigrette maison", "Verrerie artisanale", "Un tiramisu offert", "", null, undefined]) {
    assert.equal(parleDAlcool(texte), false, String(texte));
  }
});

test("lieuEvoqueAlcool : un bar, ou une offre, un plat ou des étiquettes qui parlent d'alcool", () => {
  const resto = { type: "resto" as const, plat: "Cacio e pepe · 12 €", info: "Trattoria", tags: ["Fait maison"] };
  assert.equal(lieuEvoqueAlcool(resto), false);
  assert.equal(lieuEvoqueAlcool({ ...resto, type: "bar" }), true);
  assert.equal(lieuEvoqueAlcool({ ...resto, alerte: "Happy hour jusqu'à 20h" }), true);
  assert.equal(lieuEvoqueAlcool({ ...resto, sos: { places: 4, jusqua: "22:00", offre: "Un spritz offert" } }), true);
  assert.equal(lieuEvoqueAlcool({ ...resto, tags: ["Muscat", "Terrasse"] }), true);
  assert.equal(lieuEvoqueAlcool({ ...resto, sos: { places: 6, jusqua: "21:30", offre: "Un tiramisu offert" } }), false);
});

test("carteContientAlcool : seulement les éléments marqués alcool", () => {
  assert.equal(carteContientAlcool(null), false);
  assert.equal(carteContientAlcool({ sections: [] }), false);
  assert.equal(carteContientAlcool({ sections: [{ titre: "À boire", elements: [{ nom: "Limonade", prix: 4 }] }] }), false);
  assert.equal(carteContientAlcool({ sections: [{ titre: "À boire", elements: [{ nom: "Limonade", prix: 4 }, { nom: "Picpoul", prix: 5, alcool: true }] }] }), true);
});

test("estRecompenseAlcool : un majeur voit la version avec alcool, un 15-17 ans jamais", () => {
  const cabane = { recompense: "Un verre de picpoul", alcool: true };
  assert.equal(estRecompenseAlcool(cabane, true), true);
  assert.equal(estRecompenseAlcool(cabane, false), false);
  // Case non cochée mais mot d'alcool : compte quand même, par prudence
  assert.equal(estRecompenseAlcool({ recompense: "Un kir offert", alcool: false }, true), true);
  // « Un verre offert » coché alcool, sans mot de la liste
  assert.equal(estRecompenseAlcool({ recompense: "Un verre offert", alcool: true }, true), true);
  // Même texte pour les deux versions (« Une boisson offerte ») : pour un 15-17 ans, c'est la version sans alcool
  assert.equal(estRecompenseAlcool({ recompense: "Une boisson offerte", alcool: true }, false), false);
  assert.equal(estRecompenseAlcool({ recompense: "Un tiramisu maison", alcool: false }, true), false);
});
