import assert from "node:assert/strict";
import { test } from "node:test";

import { choisirAnnonceApp } from "~/fonctions/annonces-app/choisir-annonce-app";

const MAINTENANT = Date.parse("2026-10-15T12:00:00.000Z");

const annonce = (id, plus = {}) => ({ id, titre: `Annonce ${id}`, texte: "Salut les Miamis !", emoji: null, bouton: null, fin: null, ...plus });

test("liste vide : aucune annonce", () => {
  assert.equal(choisirAnnonceApp([], [], MAINTENANT), null);
  assert.equal(choisirAnnonceApp([], [1, 2, 3], MAINTENANT), null);
});

test("toutes déjà vues sur ce téléphone : aucune annonce", () => {
  assert.equal(choisirAnnonceApp([annonce(3), annonce(2), annonce(1)], [1, 2, 3], MAINTENANT), null);
});

test("ordre : la première de la liste (la plus récente) pas encore vue", () => {
  const liste = [annonce(7), annonce(9), annonce(4)];
  assert.equal(choisirAnnonceApp(liste, [], MAINTENANT)?.id, 7);
  assert.equal(choisirAnnonceApp(liste, [7], MAINTENANT)?.id, 9);
  assert.equal(choisirAnnonceApp(liste, [7, 9], MAINTENANT)?.id, 4);
  assert.equal(choisirAnnonceApp(liste, [9, 4], MAINTENANT)?.id, 7);
});

test("fin passée côté téléphone : sautée, même si le serveur l'a encore envoyée", () => {
  const liste = [annonce(3, { fin: "2026-10-15T11:59:59.000Z" }), annonce(2, { fin: "2026-10-15T12:00:00.000Z" }), annonce(1, { fin: "2026-10-15T12:00:01.000Z" })];
  assert.equal(choisirAnnonceApp(liste, [], MAINTENANT)?.id, 1);
  assert.equal(choisirAnnonceApp(liste, [1], MAINTENANT), null);
});

test("sans fin : toujours en cours", () => {
  assert.equal(choisirAnnonceApp([annonce(5, { fin: null })], [], MAINTENANT)?.id, 5);
});

test("fin illisible : sautée", () => {
  assert.equal(choisirAnnonceApp([annonce(6, { fin: "bientôt" }), annonce(5)], [], MAINTENANT)?.id, 5);
});

test("annonces mal formées venues du réseau : ignorées", () => {
  const liste = [null, "texte", { id: "8", titre: "x", texte: "y" }, annonce(4, { titre: "   " }), annonce(3, { texte: 12 }), annonce(2)];
  assert.equal(choisirAnnonceApp(liste, [], MAINTENANT)?.id, 2);
  assert.equal(choisirAnnonceApp(null, [], MAINTENANT), null);
  assert.equal(choisirAnnonceApp({ annonces: [annonce(1)] }, [], MAINTENANT), null);
});

test("identifiant non entier ou hors des entiers sûrs : ignorée", () => {
  const liste = [annonce(2.5), annonce(Number.NaN), annonce(Number.MAX_SAFE_INTEGER + 1), annonce(Number.POSITIVE_INFINITY), annonce(1)];
  assert.equal(choisirAnnonceApp(liste, [], MAINTENANT)?.id, 1);
});

test("identifiant négatif (pop-ups de la démo) : accepté", () => {
  assert.equal(choisirAnnonceApp([annonce(-2), annonce(-1)], [], MAINTENANT)?.id, -2);
  assert.equal(choisirAnnonceApp([annonce(-2), annonce(-1)], [-2], MAINTENANT)?.id, -1);
});

test("bouton mal formé : l'annonce est ignorée plutôt que de planter à l'affichage", () => {
  const malFormes = [
    { lien: "/explorer" },
    { libelle: "", lien: "/explorer" },
    { libelle: "   ", lien: "/explorer" },
    { libelle: 12, lien: "/explorer" },
    { libelle: "Go", lien: 42 },
    { libelle: "Go" },
    "/explorer",
    true,
  ];
  for (const bouton of malFormes) {
    assert.equal(choisirAnnonceApp([annonce(9, { bouton }), annonce(1)], [], MAINTENANT)?.id, 1, JSON.stringify(bouton));
  }
  assert.equal(choisirAnnonceApp([annonce(9, { bouton: undefined })], [], MAINTENANT)?.id, 9);
});

test("emoji qui n'est pas du texte : l'annonce est ignorée", () => {
  for (const emoji of [{ texte: "🛟" }, ["🛟"], 7, true]) {
    assert.equal(choisirAnnonceApp([annonce(9, { emoji }), annonce(1)], [], MAINTENANT)?.id, 1, JSON.stringify(emoji));
  }
  assert.equal(choisirAnnonceApp([annonce(9, { emoji: undefined })], [], MAINTENANT)?.id, 9);
});

test("rend l'annonce telle quelle (bouton et emoji compris)", () => {
  const a = annonce(10, { emoji: "🛟", bouton: { libelle: "Je file explorer", lien: "/explorer" } });
  assert.equal(choisirAnnonceApp([a], [], MAINTENANT), a);
});
