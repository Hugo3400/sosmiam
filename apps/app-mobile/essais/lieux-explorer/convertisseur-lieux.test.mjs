import assert from "node:assert/strict";
import { test } from "node:test";

import { convertirLieuApi } from "~/fonctions/lieux/convertir-lieu-api";
import { creerConvertisseurLieux } from "~/fonctions/lieux/creer-convertisseur-lieux";

import { creerLieux } from "./donnees.mjs";

const lieuxApi = creerLieux(50, 11).map(({ km, prixMoyen, ...lieu }) => ({ ...lieu, prixMoyen: km > 10 ? undefined : prixMoyen }));
const MARSEILLE = { latitude: 43.2965, longitude: 5.3698 };

test("même lieu que convertirLieuApi, avec ou sans point de départ", () => {
  for (const depart of [MARSEILLE, null]) {
    const convertir = creerConvertisseurLieux(depart);
    for (const lieu of lieuxApi) assert.deepEqual(convertir(lieu), convertirLieuApi(lieu, depart));
  }
});

test("un lieu reçu une deuxième fois (même objet) rend le même objet : rien ne se redessine", () => {
  const convertir = creerConvertisseurLieux(MARSEILLE);
  const premiers = lieuxApi.map(convertir);
  const seconds = lieuxApi.map(convertir);
  seconds.forEach((lieu, i) => assert.equal(lieu, premiers[i]));
});

test("un lieu relu sur le serveur (nouvel objet) est reconverti", () => {
  const convertir = creerConvertisseurLieux(MARSEILLE);
  const avant = convertir(lieuxApi[0]);
  const relu = convertir({ ...lieuxApi[0], nom: "Chez Gégé" });
  assert.notEqual(relu, avant);
  assert.equal(relu.nom, "Chez Gégé");
});

test("une autre ville de départ : un autre convertisseur, des distances recalculées", () => {
  const lieu = lieuxApi.find((l) => l.position);
  const depuisMarseille = creerConvertisseurLieux(MARSEILLE)(lieu);
  const depuisLille = creerConvertisseurLieux({ latitude: 50.6292, longitude: 3.0573 })(lieu);
  assert.notEqual(depuisMarseille.km, depuisLille.km);
});
