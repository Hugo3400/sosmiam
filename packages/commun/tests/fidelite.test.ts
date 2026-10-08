import { test } from "node:test";
import assert from "node:assert/strict";
import type { EtatCarteFidelite } from "../src/types/fidelite.ts";
import { appliquerTampon } from "../src/fonctions/fidelite/appliquer-tampon.ts";
import { choisirRecompenseAffichee } from "../src/fonctions/fidelite/choisir-recompense-affichee.ts";
import { contientMotAlcool } from "../src/fonctions/fidelite/contient-mot-alcool.ts";

const T0 = Date.parse("2026-10-09T19:00:00.000Z");
const actif = { actif: true, visitesRequises: 5 };
const tiramisu = { id: 7, libelle: "Un tiramisu maison" };
/** La Cabane d'Émile : un verre de picpoul, et un café gourmand pour les moins de 18 ans */
const cabane = { recompense: "Un verre de picpoul", alcool: true, recompenseSansAlcool: "Un café gourmand" };

test("récompense alcoolisée : la version avec alcool pour un majeur, sans alcool pour un 15-17 ans", () => {
  assert.equal(choisirRecompenseAffichee(cabane, true), "Un verre de picpoul");
  assert.equal(choisirRecompenseAffichee(cabane, false), "Un café gourmand");
});

test("récompense sans alcool : la même pour tout le monde", () => {
  const nonna = { recompense: "Un tiramisu maison", alcool: false, recompenseSansAlcool: null };
  assert.equal(choisirRecompenseAffichee(nonna, true), "Un tiramisu maison");
  assert.equal(choisirRecompenseAffichee(nonna, false), "Un tiramisu maison");
});

test("un 15-17 ans ne reçoit jamais d'alcool, même case décochée ou version sans alcool mal remplie", () => {
  // Case « alcool » décochée mais mot d'alcool : traité comme alcoolisé
  assert.equal(choisirRecompenseAffichee({ ...cabane, alcool: false }, false), "Un café gourmand");
  assert.equal(choisirRecompenseAffichee({ ...cabane, alcool: false }, true), "Un verre de picpoul");
  // Pas de version sans alcool : rien (aucune mention de l'autre)
  assert.equal(choisirRecompenseAffichee({ ...cabane, recompenseSansAlcool: null }, false), null);
  assert.equal(choisirRecompenseAffichee({ ...cabane, recompenseSansAlcool: "   " }, false), null);
  // « Sans alcool » qui en contient : écartée
  assert.equal(choisirRecompenseAffichee({ ...cabane, recompenseSansAlcool: "Un kir maison" }, false), null);
  // Le Verre Tordu : « Un verre offert » n'a pas de mot d'alcool, mais la case est cochée
  const verreTordu = { recompense: "Un verre offert", alcool: true, recompenseSansAlcool: "Un sirop maison" };
  assert.equal(choisirRecompenseAffichee(verreTordu, false), "Un sirop maison");
});

test("« Un verre de picpoul » contient un mot d'alcool (et force la case)", () => {
  assert.equal(contientMotAlcool("Un verre de picpoul"), true);
  assert.equal(contientMotAlcool("Un verre de PICPOUL !"), true);
});

test("mots d'alcool : entiers, sans accent ni majuscule, malgré la ponctuation", () => {
  for (const texte of ["L'Apéro offert", "2 Bières !", "Un gin-tonic", "Une coupe de Crémant", "Un shot", "Mojito du chef"]) {
    assert.equal(contientMotAlcool(texte), true, texte);
  }
  for (const texte of ["Un tiramisu maison", "Une vinaigrette maison", "Un ginger maison", "Un café gourmand", "Un verre offert", ""]) {
    assert.equal(contientMotAlcool(texte), false, texte);
  }
});

test("carte à 4 sur 5, puis +1 : 0 tampon et une récompense prête, figée", () => {
  const carte: EtatCarteFidelite = { tampons: 4, pretes: [] };
  const { carte: apres, recompenseGagnee } = appliquerTampon(carte, actif, 1, tiramisu, T0);
  assert.equal(recompenseGagnee, true);
  assert.equal(apres.tampons, 0);
  assert.deepEqual(apres.pretes, [{ id: 7, libelle: "Un tiramisu maison", gagneeLe: "2026-10-09T19:00:00.000Z" }]);
  // La carte d'origine n'a pas bougé
  assert.deepEqual(carte, { tampons: 4, pretes: [] });
});

test("tampon +1 en cours de carte, et une récompense déjà prête reste", () => {
  const dejaPrete = { id: 1, libelle: "Un chou à la crème", gagneeLe: "2026-09-01T12:00:00.000Z" };
  const { carte, recompenseGagnee } = appliquerTampon({ tampons: 2, pretes: [dejaPrete] }, actif, 1, tiramisu, T0);
  assert.equal(recompenseGagnee, false);
  assert.deepEqual(carte, { tampons: 3, pretes: [dejaPrete] });
});

test("programme inactif : rien ne change", () => {
  const carte: EtatCarteFidelite = { tampons: 4, pretes: [] };
  assert.deepEqual(appliquerTampon(carte, { actif: false, visitesRequises: 5 }, 1, tiramisu, T0), { carte, recompenseGagnee: false });
  assert.deepEqual(appliquerTampon(carte, { actif: false, visitesRequises: 5 }, -1, tiramisu, T0), { carte, recompenseGagnee: false });
});

test("tampon −1 : jamais sous 0, et la récompense gagnée reste acquise", () => {
  const gagnee = appliquerTampon({ tampons: 4, pretes: [] }, actif, 1, tiramisu, T0).carte;
  const retiree = appliquerTampon(gagnee, actif, -1, tiramisu, T0);
  assert.equal(retiree.carte.tampons, 0);
  assert.equal(retiree.carte.pretes.length, 1);
  assert.equal(retiree.recompenseGagnee, false);
  assert.equal(appliquerTampon({ tampons: 3, pretes: [] }, actif, -1, tiramisu, T0).carte.tampons, 2);
});

test("carte au-delà du nombre de visites (programme raccourci) : la récompense tombe au tampon suivant", () => {
  const { carte, recompenseGagnee } = appliquerTampon({ tampons: 7, pretes: [] }, actif, 1, tiramisu, T0);
  assert.equal(recompenseGagnee, true);
  assert.equal(carte.tampons, 0);
});
