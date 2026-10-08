import { test } from "node:test";
import assert from "node:assert/strict";
import type { PositionLieu } from "../src/types/lieu.ts";
import type { LecturePosition } from "../src/types/position.ts";
import { calculerDistanceMetres } from "../src/fonctions/geo/calculer-distance-metres.ts";
import { evaluerPosition } from "../src/fonctions/visites/evaluer-position.ts";
import { traduireResultatPosition } from "../src/fonctions/visites/traduire-resultat-position.ts";
import { estLecturePositionValide } from "../src/validation/est-lecture-position-valide.ts";

// Chez Nonna Lia, à Montpellier (coordonnées d'exemple)
const LIEU: PositionLieu = { latitude: 43.6119, longitude: 3.8772 };
const METRES_PAR_DEGRE_LATITUDE = (6_371_000 * Math.PI) / 180;

/** Une lecture placée à `distanceM` au nord du lieu */
function lireA(distanceM: number, precision: number | null, autres: Partial<LecturePosition> = {}): LecturePosition {
  return {
    latitude: LIEU.latitude + distanceM / METRES_PAR_DEGRE_LATITUDE,
    longitude: LIEU.longitude,
    precision,
    ageMs: 500,
    simulee: false,
    ...autres,
  };
}

test("calculerDistanceMetres : 0 sur place, environ 111 km pour un degré de latitude", () => {
  assert.equal(calculerDistanceMetres(LIEU, LIEU), 0);
  const unDegre = calculerDistanceMetres({ latitude: 43, longitude: 3 }, { latitude: 44, longitude: 3 });
  assert.ok(Math.abs(unDegre - 111_195) < 1);
});

test("précision 99 999 m à 50 km : imprecise", () => {
  assert.equal(evaluerPosition(lireA(50_000, 99_999), LIEU).resultat, "imprecise");
});

test("précision 15 m à 30 m : dans-rayon", () => {
  const evaluation = evaluerPosition(lireA(30, 15), LIEU);
  assert.equal(evaluation.resultat, "dans-rayon");
  assert.ok(Math.abs(evaluation.distanceM - 30) < 0.01);
});

test("précision 150 m : dans-rayon à 340 m, hors-rayon à 360 m", () => {
  assert.equal(evaluerPosition(lireA(340, 150), LIEU).resultat, "dans-rayon");
  assert.equal(evaluerPosition(lireA(360, 150), LIEU).resultat, "hors-rayon");
});

test("la tolérance est plafonnée à 150 m, même avec une précision de 400 m", () => {
  assert.equal(evaluerPosition(lireA(340, 400), LIEU).resultat, "dans-rayon");
  assert.equal(evaluerPosition(lireA(360, 400), LIEU).resultat, "hors-rayon");
});

test("le rayon du lieu peut être réglé", () => {
  assert.equal(evaluerPosition(lireA(150, 10), LIEU, 100).resultat, "hors-rayon");
  assert.equal(evaluerPosition(lireA(150, 10), LIEU, 500).resultat, "dans-rayon");
});

test("ageMs négatif ou à 60 001 : perimee ; 60 000 passe", () => {
  assert.equal(evaluerPosition(lireA(30, 15, { ageMs: -1 }), LIEU).resultat, "perimee");
  assert.equal(evaluerPosition(lireA(30, 15, { ageMs: 60_001 }), LIEU).resultat, "perimee");
  assert.equal(evaluerPosition(lireA(30, 15, { ageMs: Number.NaN }), LIEU).resultat, "perimee");
  assert.equal(evaluerPosition(lireA(30, 15, { ageMs: 60_000 }), LIEU).resultat, "dans-rayon");
});

test("précision inconnue, négative ou au-delà de 500 m : imprecise", () => {
  assert.equal(evaluerPosition(lireA(30, null), LIEU).resultat, "imprecise");
  assert.equal(evaluerPosition(lireA(30, -5), LIEU).resultat, "imprecise");
  assert.equal(evaluerPosition(lireA(30, 501), LIEU).resultat, "imprecise");
  assert.equal(evaluerPosition(lireA(30, 500), LIEU).resultat, "dans-rayon");
});

test("simulee vrai : simulee, avant tout autre contrôle", () => {
  assert.equal(evaluerPosition(lireA(30, 15, { simulee: true }), LIEU).resultat, "simulee");
  assert.equal(evaluerPosition(lireA(30, null, { simulee: true, ageMs: -1 }), LIEU).resultat, "simulee");
});

test("la distance est toujours calculée, même en cas de refus", () => {
  assert.ok(Math.abs(evaluerPosition(lireA(1_200, null), LIEU).distanceM - 1_200) < 0.1);
});

test("traduireResultatPosition", () => {
  assert.equal(traduireResultatPosition("dans-rayon"), null);
  assert.equal(traduireResultatPosition("hors-rayon"), "hors-zone");
  assert.equal(traduireResultatPosition("imprecise"), "position-imprecise");
  assert.equal(traduireResultatPosition("perimee"), "position-perimee");
  assert.equal(traduireResultatPosition("simulee"), "position-simulee");
});

test("estLecturePositionValide : forme correcte acceptée", () => {
  assert.equal(estLecturePositionValide(lireA(30, 15)), true);
  assert.equal(estLecturePositionValide(lireA(30, null)), true);
});

test("estLecturePositionValide sans simulee : false", () => {
  const { simulee: _simulee, ...sansSimulee } = lireA(30, 15);
  assert.equal(estLecturePositionValide(sansSimulee), false);
  assert.equal(estLecturePositionValide({ ...sansSimulee, simulee: "non" }), false);
});

test("estLecturePositionValide : bornes et types", () => {
  const bonne = lireA(30, 15);
  assert.equal(estLecturePositionValide(null), false);
  assert.equal(estLecturePositionValide("43.6,3.8"), false);
  assert.equal(estLecturePositionValide({ ...bonne, latitude: 91 }), false);
  assert.equal(estLecturePositionValide({ ...bonne, longitude: -181 }), false);
  assert.equal(estLecturePositionValide({ ...bonne, latitude: "43.6" }), false);
  assert.equal(estLecturePositionValide({ ...bonne, precision: 100_001 }), false);
  assert.equal(estLecturePositionValide({ ...bonne, precision: undefined }), false);
  assert.equal(estLecturePositionValide({ ...bonne, ageMs: 600_001 }), false);
  assert.equal(estLecturePositionValide({ ...bonne, ageMs: -1 }), false);
  assert.equal(estLecturePositionValide({ ...bonne, latitude: Number.NaN }), false);
});
