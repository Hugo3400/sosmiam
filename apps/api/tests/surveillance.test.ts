// Tests de la surveillance des visites (comptes louches, lieux qui refusent beaucoup), sans base.
import assert from "node:assert/strict";
import { test } from "node:test";

import { repererComptesLouches, type VisiteDecidee } from "../src/fonctions/surveillance/reperer-comptes-louches.ts";
import { repererLieuxRefusants } from "../src/fonctions/surveillance/reperer-lieux-refusants.ts";

const seuils = { parJour: 4, partRefusMin: 34, decisionsMin: 6 };
const visite = (compteId: number, lieuId: number, statut: "validee" | "refusee", iso: string): VisiteDecidee =>
  ({ compteId, lieuId, statut, valideLe: statut === "validee" ? new Date(iso) : null, decideLe: new Date(iso) });

test("plus de 4 visites validées le même jour de Paris (minuit à Paris, pas en temps universel)", () => {
  const cinq = [1, 2, 3, 4, 5].map((i) => visite(7, i, "validee", `2026-10-09T1${i}:00:00Z`));
  assert.deepEqual(repererComptesLouches(cinq, seuils).get(7), [{ type: "par-jour", jour: "2026-10-09", validees: 5 }]);
  // 4 le 9 octobre et 1 à 23 h 30 UTC, déjà le 10 à Paris : pas signalé
  const quatrePlusUne = [...cinq.slice(0, 4), visite(7, 5, "validee", "2026-10-09T23:30:00Z")];
  assert.equal(repererComptesLouches(quatrePlusUne, seuils).has(7), false);
});

test("trop de refus : au moins un tiers sur 6 décisions, et refusé par au moins 2 lieux différents", () => {
  const validees = [1, 2, 3, 4].map((i) => visite(8, 10 + i, "validee", `2026-10-0${i}T12:00:00Z`));
  const unSeulLieu = [...validees, visite(8, 99, "refusee", "2026-10-05T12:00:00Z"), visite(8, 99, "refusee", "2026-10-06T12:00:00Z")];
  assert.equal(repererComptesLouches(unSeulLieu, seuils).has(8), false, "un seul lieu ne suffit jamais");
  const deuxLieux = [...validees, visite(8, 98, "refusee", "2026-10-05T12:00:00Z"), visite(8, 99, "refusee", "2026-10-06T12:00:00Z")];
  assert.equal(repererComptesLouches(deuxLieux, seuils).has(8), false, "33 % de refus, sous le seuil de 34 %");
  assert.deepEqual(repererComptesLouches(deuxLieux, { ...seuils, partRefusMin: 33 }).get(8), [{ type: "refus", refusees: 2, decidees: 6, part: 33, lieux: 2 }]);
  assert.equal(repererComptesLouches(deuxLieux.slice(1), { ...seuils, partRefusMin: 33 }).has(8), false, "moins de 6 décisions : trop tôt pour juger");
});

test("lieux qui refusent beaucoup : part et nombre minimum de décisions", () => {
  const decisions = [
    ...Array.from({ length: 10 }, (_, i) => ({ lieuId: 1, statut: i < 6 ? "refusee" as const : "validee" as const })),
    ...Array.from({ length: 4 }, () => ({ lieuId: 2, statut: "refusee" as const })),
    ...Array.from({ length: 20 }, (_, i) => ({ lieuId: 3, statut: i < 2 ? "refusee" as const : "validee" as const })),
  ];
  assert.deepEqual(repererLieuxRefusants(decisions, { partRefusMin: 50, decisionsMin: 10 }), [{ lieuId: 1, refusees: 6, decidees: 10, part: 60 }]);
});
