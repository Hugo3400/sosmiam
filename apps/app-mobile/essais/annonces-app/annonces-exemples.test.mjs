import assert from "node:assert/strict";
import { test } from "node:test";

import { ANNONCES_EXEMPLES } from "~/contenus/annonces-exemples";
import { choisirAnnonceApp } from "~/fonctions/annonces-app/choisir-annonce-app";
import { lireLienAnnonceApp } from "~/fonctions/annonces-app/lire-lien-annonce-app";

const MAINTENANT = Date.parse("2026-10-15T12:00:00.000Z");

test("démo : des identifiants négatifs et uniques, que le serveur ne donnera jamais (pas de collision avec les vraies pop-ups vues)", () => {
  const ids = ANNONCES_EXEMPLES.map((annonce) => annonce.id);
  assert.ok(ids.every((id) => Number.isSafeInteger(id) && id < 0), JSON.stringify(ids));
  assert.equal(new Set(ids).size, ids.length);
});

test("démo : une seule pop-up montrée, puis plus rien une fois vue", () => {
  const premiere = choisirAnnonceApp(ANNONCES_EXEMPLES, [], MAINTENANT);
  assert.ok(premiere);
  assert.equal(choisirAnnonceApp(ANNONCES_EXEMPLES, [premiere.id], MAINTENANT), null);
});

test("démo : signée la Brigade sur sa propre ligne, sans alcool, avec un bouton vers un vrai écran (même en visite)", () => {
  const premiere = choisirAnnonceApp(ANNONCES_EXEMPLES, [], MAINTENANT);
  assert.match(premiere.texte, /\n\nSigné : la Brigade$/);
  for (const annonce of ANNONCES_EXEMPLES) {
    assert.doesNotMatch(`${annonce.titre} ${annonce.texte}`, /alcool|bi[eè]re|vin\b|ap[eé]ro|cocktail|bar\b|pinte/i);
  }
  assert.ok(premiere.bouton);
  assert.equal(lireLienAnnonceApp(premiere.bouton.lien, { compte: false }), premiere.bouton.lien);
});
