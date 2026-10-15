import assert from "node:assert/strict";
import { test } from "node:test";

import { lieuEvoqueAlcool } from "@sos-miam/commun/fonctions/prevention/lieu-evoque-alcool";
import { lireAlcoolLieu } from "~/fonctions/lieux/lire-alcool-lieu";
import { plafonnerCarrouselSos } from "~/fonctions/lieux/plafonner-carrousel-sos";

import { creerLieux } from "../lieux-explorer/donnees.mjs";

const LIEUX = creerLieux(500, 21);
const element = (lieu) => ({ lieu, km: null });
const enSos = LIEUX.filter((l) => l.sos).map(element);
const enAlerte = LIEUX.filter((l) => !l.sos)
  .map((l, i) => ({ ...l, alerte: `Bon plan n°${i}` }))
  .map(element);

test("sous le plafond : la même liste, rien de caché", () => {
  const sos = [...enSos.slice(0, 4), ...enAlerte.slice(0, 5)];
  assert.equal(plafonnerCarrouselSos(sos, 12), sos);
});

test("au-dessus du plafond : tous les SOS restent, les bons plans complètent jusqu'au plafond, dans le même ordre", () => {
  const sos = [...enSos.slice(0, 5), ...enAlerte.slice(0, 30)];
  const cartes = plafonnerCarrouselSos(sos, 12);
  assert.equal(cartes.length, 12);
  assert.deepEqual(
    cartes.map((c) => c.lieu.id),
    sos.slice(0, 12).map((c) => c.lieu.id),
  );
  assert.equal(cartes.filter((c) => c.lieu.sos).length, 5);
});

test("plus de SOS que le plafond : aucun SOS caché, plus aucun bon plan", () => {
  assert.ok(enSos.length > 12);
  const sos = [...enSos, ...enAlerte.slice(0, 10)];
  const cartes = plafonnerCarrouselSos(sos, 12);
  assert.deepEqual(
    cartes.map((c) => c.lieu.id),
    enSos.map((c) => c.lieu.id),
  );
});

test("message sanitaire : même réponse que lieuEvoqueAlcool, relue pour un lieu recopié", () => {
  const lieux = LIEUX.map((l, i) => (i % 5 === 0 ? { ...l, alerte: "Happy hour jusqu'à 20 h" } : i % 7 === 0 ? { ...l, type: "bar" } : l));
  for (const lieu of lieux) {
    assert.equal(lireAlcoolLieu(lieu), lieuEvoqueAlcool(lieu), lieu.nom);
    assert.equal(lireAlcoolLieu(lieu), lieuEvoqueAlcool(lieu), `${lieu.nom}, deuxième lecture`);
  }
  const sobre = { ...LIEUX[0], type: "resto", alerte: undefined, sos: { places: 2, jusqua: "22:00", offre: "Un dessert offert" }, plat: "Soupe", info: "Cantine", tags: [] };
  assert.equal(lireAlcoolLieu(sobre), false);
  const copie = { ...sobre, sos: { ...sobre.sos, offre: "Un verre de vin offert" } };
  assert.equal(lireAlcoolLieu(copie), lieuEvoqueAlcool(copie));
  assert.equal(lireAlcoolLieu(sobre), false);
});
