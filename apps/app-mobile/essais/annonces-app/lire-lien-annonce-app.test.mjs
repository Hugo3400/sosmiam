import assert from "node:assert/strict";
import { test } from "node:test";

import { lireLienAnnonceApp } from "~/fonctions/annonces-app/lire-lien-annonce-app";

const COMPTE = { compte: true };
const VISITE = { compte: false };

test("les écrans proposés par le logiciel, plus les notifications et les messages : gardés", () => {
  for (const lien of ["/", "/explorer", "/potes", "/profil", "/notifications", "/potes/messages", "/lieu/18"]) {
    assert.equal(lireLienAnnonceApp(lien, COMPTE), lien, lien);
  }
});

test("lien inconnu, externe ou mal formé : pas de bouton", () => {
  for (const lien of ["https://exemple.fr", "//exemple.fr", "/reglages", "/lieu/abc", "/explorer?x=1", "explorer", "", null, undefined, 42, "/lieu/18/../../reglages", "/lieu/1234567890"]) {
    assert.equal(lireLienAnnonceApp(lien, COMPTE), null, String(lien));
  }
});

test("jamais vers Miam Safe, le comptoir pro ou l'écran privé d'une seule personne, même si les notifications y vont", () => {
  for (const lien of ["/miam-safe/partage/3", "/pro/comptoir", "/potes/discussion/12", "/potes/sortie/3", "/potes/profil/abcdefgh23"]) {
    assert.equal(lireLienAnnonceApp(lien, COMPTE), null, lien);
  }
});

test("visite sans compte : seulement les écrans ouverts sans compte", () => {
  for (const lien of ["/", "/explorer", "/potes", "/profil", "/lieu/7"]) assert.equal(lireLienAnnonceApp(lien, VISITE), lien, lien);
  for (const lien of ["/notifications", "/potes/messages", "/potes/discussion/1", "/miam-safe/partage/2"]) assert.equal(lireLienAnnonceApp(lien, VISITE), null, lien);
});
