import assert from "node:assert/strict";
import { test } from "node:test";

import { choisirCranFeuille } from "~/fonctions/interaction/choisir-cran-feuille";

const ORDRE = ["carte", "repliee", "moitie", "depliee"];
const HAUTEURS = { carte: 56, repliee: 220, moitie: 400, depliee: 690 };

test("depuis la feuille dépliée, un petit glissement vers le bas (ou un lancer) descend d'un cran", () => {
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "depliee", 690 - 80, 0), "moitie");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "depliee", 690 - 20, 0.6), "moitie");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "depliee", 690 - 30, 0), "depliee");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "depliee", 690 - 8, 0.05), "depliee");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "depliee", 230, 0), "repliee");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "depliee", 60, 0.5), "carte");
});

test("depuis chaque cran, on monte et on descend d'un cran de la même façon", () => {
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "moitie", 400 - 70, 0), "repliee");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "moitie", 400 + 80, 0), "depliee");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "repliee", 220 + 60, 0), "moitie");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "repliee", 220 - 60, 0), "carte");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "carte", 56 + 50, 0), "repliee");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "carte", 56 - 30, 1), "carte");
  assert.equal(choisirCranFeuille(HAUTEURS, ORDRE, "depliee", 690 + 30, -1), "depliee");
});

test("deux crans à la même hauteur (lecteur d'écran, petit écran) : on va au cran voisin, jamais nulle part", () => {
  const lecteur = { carte: 220, repliee: 220, moitie: 400, depliee: 690 };
  assert.equal(choisirCranFeuille(lecteur, ORDRE, "moitie", 300, 0), "repliee");
  assert.equal(choisirCranFeuille(lecteur, ORDRE, "repliee", 150, 0.8), "repliee");
  const petit = { carte: 56, repliee: 220, moitie: 300, depliee: 300 };
  assert.equal(choisirCranFeuille(petit, ORDRE, "repliee", 290, 0), "moitie");
  assert.equal(choisirCranFeuille(petit, ORDRE, "depliee", 250, 0), "repliee");
});
