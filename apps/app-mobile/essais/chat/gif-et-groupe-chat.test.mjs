import assert from "node:assert/strict";
import { test } from "node:test";

import { LONGUEUR_MAX_RECHERCHE_GIF } from "@sos-miam/commun/regles/chat";
import { bornerDecalageZoom } from "~/fonctions/chat/borner-decalage-zoom";
import { calculerTailleGif } from "~/fonctions/chat/calculer-taille-gif";
import { calculerZoomPincement } from "~/fonctions/chat/calculer-zoom-pincement";
import { construireRequeteGif } from "~/fonctions/chat/construire-requete-gif";
import { decrireMembresGroupe } from "~/fonctions/chat/decrire-membres-groupe";
import { repartirGifsColonnes } from "~/fonctions/chat/repartir-gifs-colonnes";

test("recherche de GIF : le texte tapé d'abord, puis la pastille, sinon les tendances", () => {
  assert.deepEqual(construireRequeteGif("", null), { type: "tendances" });
  assert.deepEqual(construireRequeteGif("   ", null), { type: "tendances" });
  assert.deepEqual(construireRequeteGif("", "j'ai faim"), { type: "recherche", q: "j'ai faim" });
  assert.deepEqual(construireRequeteGif("  apéro   du  soir ", "miam"), { type: "recherche", q: "apéro du soir" });
});

test("recherche de GIF : 50 caractères au plus, sans couper un emoji", () => {
  const long = construireRequeteGif("a".repeat(80), null);
  assert.equal(long.q.length, LONGUEUR_MAX_RECHERCHE_GIF);
  const emoji = construireRequeteGif(`${"b".repeat(49)}😋😋`, null);
  assert.equal(Array.from(emoji.q).length, LONGUEUR_MAX_RECHERCHE_GIF);
  assert.ok(emoji.q.endsWith("😋"));
});

test("taille d'un GIF : la forme gardée, ni trop haut ni trop plat", () => {
  assert.deepEqual(calculerTailleGif({ largeur: 400, hauteur: 300 }, 220), { largeur: 220, hauteur: 165 });
  assert.deepEqual(calculerTailleGif({ largeur: 100, hauteur: 1000 }, 220), { largeur: 220, hauteur: 367 });
  assert.deepEqual(calculerTailleGif({ largeur: 1000, hauteur: 100 }, 220), { largeur: 220, hauteur: 100 });
  assert.deepEqual(calculerTailleGif({ largeur: 0, hauteur: 0 }, 220), { largeur: 220, hauteur: 220 });
});

test("grille de GIF : chacun dans la colonne la plus courte, l'ordre gardé", () => {
  const gif = (id, largeur, hauteur) => ({ id, url: "", largeur, hauteur });
  const [gauche, droite] = repartirGifsColonnes([gif("a", 100, 200), gif("b", 100, 50), gif("c", 100, 50), gif("d", 100, 100)], 100);
  assert.deepEqual(gauche.map((g) => g.id), ["a"]);
  assert.deepEqual(droite.map((g) => g.id), ["b", "c", "d"]);
  assert.deepEqual(repartirGifsColonnes([], 100), [[], []]);
});

test("zoom : l'écart des doigts multiplie le zoom de départ, entre 1 et 4", () => {
  assert.equal(calculerZoomPincement(1, 100, 200), 2);
  assert.equal(calculerZoomPincement(2, 100, 50), 1);
  assert.equal(calculerZoomPincement(3, 100, 300), 4);
  assert.equal(calculerZoomPincement(1, 100, 20), 1);
  assert.equal(calculerZoomPincement(2, 0, 100), 2);
});

test("zoom : la photo déplacée ne quitte jamais l'écran", () => {
  assert.equal(bornerDecalageZoom(500, 2, 400), 200);
  assert.equal(bornerDecalageZoom(-500, 2, 400), -200);
  assert.equal(bornerDecalageZoom(50, 2, 400), 50);
  assert.equal(bornerDecalageZoom(50, 1, 400), 0);
});

test("groupe : le nombre de membres et qui l'a créé", () => {
  assert.equal(decrireMembresGroupe(4, "Karim"), "4 membres · créé par Karim");
  assert.equal(decrireMembresGroupe(1, "toi"), "1 membre · créé par toi");
  assert.equal(decrireMembresGroupe(3, null), "3 membres");
});
