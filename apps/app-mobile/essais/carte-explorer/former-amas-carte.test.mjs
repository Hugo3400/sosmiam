import assert from "node:assert/strict";
import { test } from "node:test";

import { formerAmasCarte } from "~/fonctions/geo/former-amas-carte";

import { creerPointsFrance } from "./donnees.mjs";

function projeter(points) {
  return [...points]
    .sort((a, b) => a.id - b.id)
    .map((point) => {
      const sinus = Math.sin((point.latitude * Math.PI) / 180);
      return { point, x: (point.longitude + 180) / 360, y: 0.5 - Math.log((1 + sinus) / (1 - sinus)) / (4 * Math.PI) };
    });
}

test("chaque lieu est dans un seul amas, avec son groupe tout prêt", () => {
  const projetes = projeter(creerPointsFrance(3000, 31));
  for (const niveau of [8, 11.5, 14, 17]) {
    const amas = formerAmasCarte(projetes, niveau);
    const vus = amas.flatMap((un) => un.groupe.ids);
    assert.equal(vus.length, projetes.length, `niveau ${niveau}`);
    assert.equal(new Set(vus).size, projetes.length, `niveau ${niveau}`);
    assert.equal(new Set(amas.map((un) => un.groupe.cle)).size, amas.length);
    for (const un of amas) {
      assert.deepEqual(un.groupe.ids, [...un.groupe.ids].sort((a, b) => a - b));
      assert.equal(un.groupe.nombre, un.membres.length);
      const latitudes = un.membres.map(({ point }) => point.latitude);
      const longitudes = un.membres.map(({ point }) => point.longitude);
      assert.equal(un.nord, Math.max(...latitudes));
      assert.equal(un.sud, Math.min(...latitudes));
      assert.equal(un.ouest, Math.min(...longitudes));
      assert.equal(un.est, Math.max(...longitudes));
      assert.ok(Math.abs(un.groupe.latitude - latitudes.reduce((s, v) => s + v, 0) / latitudes.length) < 1e-9);
    }
  }
});

test("après fusion, deux amas sont toujours à plus d'un rayon l'un de l'autre", () => {
  const projetes = projeter(creerPointsFrance(3000, 32));
  for (const niveau of [9, 12, 15]) {
    const rayon = 2 ** -niveau;
    const centres = formerAmasCarte(projetes, niveau).map((un) => ({
      x: un.membres.reduce((s, m) => s + m.x, 0) / un.membres.length,
      y: un.membres.reduce((s, m) => s + m.y, 0) / un.membres.length,
    }));
    for (let i = 0; i < centres.length; i++) {
      for (let j = i + 1; j < centres.length; j++) {
        assert.ok(Math.hypot(centres[i].x - centres[j].x, centres[i].y - centres[j].y) > rayon, `niveau ${niveau} : amas ${i} et ${j} trop proches`);
      }
    }
  }
});

test("des lieux à la même adresse restent ensemble, à tous les niveaux", () => {
  const meme = { latitude: 43.2951, longitude: 5.3745 };
  const projetes = projeter([1, 2, 3, 4].map((id) => ({ id, ...meme, prioritaire: false })));
  for (const niveau of [6, 12, 18, 24]) {
    const amas = formerAmasCarte(projetes, niveau);
    assert.equal(amas.length, 1);
    assert.deepEqual(amas[0].groupe.ids, [1, 2, 3, 4]);
    assert.equal(amas[0].groupe.cle, `${niveau}:1`);
  }
});
