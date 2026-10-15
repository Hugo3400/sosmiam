import { test } from "node:test";
import assert from "node:assert/strict";
import { MESSAGE_SANITAIRE_ALCOOL } from "../src/contenus/prevention-alcool.ts";
import { estEvenementAlcool } from "../src/fonctions/evenements/est-evenement-alcool.ts";
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
  for (const texte of ["Un muscadet bien frais avec les huîtres", "Un verre de bourbon", "Saké chaud offert", "Un petit génépi pour finir", "Vin mousseux du coin"]) {
    assert.equal(parleDAlcool(texte), true, texte);
  }
  for (const texte of ["Salle calme ce soir", "Fournée du soir à -30 %", "Vinaigrette maison", "Verrerie artisanale", "Un tiramisu offert", "", null, undefined]) {
    assert.equal(parleDAlcool(texte), false, String(texte));
  }
});

test("parleDAlcool : bourbon, mousseux, sancerre, chablis et beaujolais seulement quand c'est à boire", () => {
  for (const texte of [
    "Ribs au bourbon",
    "Bourbon-coca à 7 €",
    "Une coupe de mousseux offerte",
    "Du mousseux pour trinquer",
    "Deux verres de mousseux",
    "Un Sancerre blanc bien frais",
    "Sancerre rosé",
    "Un petit chablis avec les huîtres",
    "Chablis premier cru",
    "Beaujolais nouveau",
    "Un verre de Beaujolais",
  ]) {
    assert.equal(parleDAlcool(texte), true, texte);
  }
  for (const texte of [
    "Atelier flan vanille Bourbon",
    "Flan à la vanille Bourbon",
    "Café Bourbon pointu de La Réunion",
    "Cappuccino bien mousseux",
    "Lait bien mousseux",
    "Chocolat chaud mousseux",
    "Une mousse au chocolat",
    "Le groupe vient de Sancerre",
    "Concert à Sancerre",
    "Balade à Chablis",
    "Randonnée dans le Beaujolais",
    "Fromages du Beaujolais",
  ]) {
    assert.equal(parleDAlcool(texte), false, texte);
  }
});

test("parleDAlcool : œ, ø et ß restent des lettres, un mot d'alcool collé à elles ne compte pas", () => {
  for (const texte of ["Ginœ", "Vinø", "ßgin"]) assert.equal(parleDAlcool(texte), false, texte);
  for (const texte of ["Œil de chef, gin maison", "Un gin, ø"]) assert.equal(parleDAlcool(texte), true, texte);
});

test("une pâtisserie à la vanille Bourbon : ni message sanitaire, ni événement caché, ni alcool forcé", () => {
  const patisserie = { type: "patisserie" as const, plat: "Flan à la vanille Bourbon", info: "Pâtisserie de quartier", tags: ["Fait maison"] };
  assert.equal(lieuEvoqueAlcool(patisserie), false);
  assert.equal(estEvenementAlcool({ alcool: false, titre: "Atelier flan vanille Bourbon", description: "Avec un lait bien mousseux pour les gourmands" }, "patisserie"), false);
  assert.equal(estEvenementAlcool({ alcool: false, titre: "Concert à Sancerre", description: "Le groupe vient de Chablis" }, "patisserie"), false);
  assert.equal(estRecompenseAlcool({ recompense: "Un éclair vanille bourbon offert", alcool: false }), false);
  assert.equal(estRecompenseAlcool({ recompense: "Une coupe de mousseux offerte", alcool: false }), true);
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

test("estRecompenseAlcool : case cochée ou mot d'alcool (le message sanitaire va avec)", () => {
  assert.equal(estRecompenseAlcool({ recompense: "Un verre de picpoul", alcool: true }), true);
  // Case non cochée mais mot d'alcool : compte quand même, par prudence
  assert.equal(estRecompenseAlcool({ recompense: "Un kir offert", alcool: false }), true);
  // « Un verre offert » coché alcool, sans mot de la liste
  assert.equal(estRecompenseAlcool({ recompense: "Un verre offert", alcool: true }), true);
  assert.equal(estRecompenseAlcool({ recompense: "Un tiramisu maison", alcool: false }), false);
});
