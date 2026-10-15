import assert from "node:assert/strict";
import { test } from "node:test";

import { lireLienAnnonceApp } from "~/fonctions/annonces-app/lire-lien-annonce-app";

const COMPTE = { compte: true, pro: false };
const VISITE = { compte: false, pro: false };
const PRO = { compte: true, pro: true };

test("un écran connu des notifications : gardé", () => {
  for (const lien of ["/", "/explorer", "/potes", "/profil", "/notifications", "/lieu/18", "/potes/messages", "/potes/discussion/12", "/potes/sortie/3", "/potes/profil/abcdefgh23"]) {
    assert.equal(lireLienAnnonceApp(lien, COMPTE), lien, lien);
  }
});

test("lien inconnu, externe ou mal formé : pas de bouton", () => {
  for (const lien of ["https://exemple.fr", "//exemple.fr", "/reglages", "/lieu/abc", "/explorer?x=1", "explorer", "", null, undefined, 42, "/lieu/18/../../reglages"]) {
    assert.equal(lireLienAnnonceApp(lien, PRO), null, String(lien));
  }
});

test("visite sans compte : seulement les écrans ouverts sans compte", () => {
  for (const lien of ["/", "/explorer", "/potes", "/profil", "/lieu/7"]) assert.equal(lireLienAnnonceApp(lien, VISITE), lien, lien);
  for (const lien of ["/notifications", "/potes/messages", "/potes/discussion/1", "/miam-safe/partage/2"]) assert.equal(lireLienAnnonceApp(lien, VISITE), null, lien);
});

test("mode pro : seulement avec le mode pro ouvert", () => {
  assert.equal(lireLienAnnonceApp("/pro/comptoir", COMPTE), null);
  assert.equal(lireLienAnnonceApp("/pro/comptoir", PRO), "/pro/comptoir");
});
