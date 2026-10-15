import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerFenetreListeLieux } from "~/fonctions/lieux/calculer-fenetre-liste-lieux";

const finDeFenetre = (visible, fenetre) => visible + 0.5 * (fenetre - 1) * visible;

test("en haut de la liste, la fenêtre de rendu dépasse toujours l'en-tête (sinon la FlatList monte tous les lieux)", () => {
  for (let visible = 20; visible <= 1000; visible += 7) {
    for (let enTete = 0; enTete <= 700; enTete += 13) {
      const fenetre = calculerFenetreListeLieux(visible, enTete);
      assert.ok(Number.isInteger(fenetre) && fenetre >= 5 && fenetre <= 21, `${visible} / ${enTete} : ${fenetre}`);
      if (fenetre < 21) {
        assert.ok(finDeFenetre(visible, fenetre) >= enTete + visible, `visible ${visible}, en-tête ${enTete}, fenêtre ${fenetre}`);
        assert.ok(finDeFenetre(visible, fenetre) - visible >= 900, `avance : visible ${visible}, fenêtre ${fenetre}`);
      }
    }
  }
});

test("liste fixe d'un téléphone : fenêtre légère de 5", () => {
  for (const visible of [450, 480, 541, 600, 700]) assert.equal(calculerFenetreListeLieux(visible, 300), 5);
  assert.equal(calculerFenetreListeLieux(300, 300), 7);
  assert.equal(calculerFenetreListeLieux(541, 0), 5);
});

test("lecteur d'écran (la liste suit la feuille) : fenêtre élargie, jamais au-delà de l'ancien réglage", () => {
  assert.equal(calculerFenetreListeLieux(210, 300), 10);
  const fenetre = calculerFenetreListeLieux(82, 330);
  assert.ok(fenetre > 5 && fenetre <= 21);
  assert.ok(finDeFenetre(82, fenetre) > 330);
  assert.equal(calculerFenetreListeLieux(0, 330), 21);
  assert.equal(calculerFenetreListeLieux(-40, 330), 21);
  assert.equal(calculerFenetreListeLieux(Number.NaN, 330), 21);
  assert.equal(calculerFenetreListeLieux(10, 2_000), 21);
});
