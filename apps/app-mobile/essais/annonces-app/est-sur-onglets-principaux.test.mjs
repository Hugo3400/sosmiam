import assert from "node:assert/strict";
import { test } from "node:test";

import { estSurOngletsPrincipaux } from "~/fonctions/annonces-app/est-sur-onglets-principaux";

test("les cinq onglets principaux", () => {
  for (const chemin of ["/", "/explorer", "/scan", "/potes", "/profil"]) assert.equal(estSurOngletsPrincipaux(chemin), true, chemin);
});

test("jamais ailleurs : accueil, inscription, connexion, Miam Safe, mode pro, écrans posés dessus", () => {
  for (const chemin of [null, "", "/bienvenue", "/fais-connaissance", "/connexion", "/compte", "/miam-safe/comptoir", "/miam-safe/partage/3", "/pro/comptoir", "/ambassadeur", "/lieu/18", "/scan/camera", "/potes/messages", "/reglages"]) {
    assert.equal(estSurOngletsPrincipaux(chemin), false, String(chemin));
  }
});
