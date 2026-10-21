import assert from "node:assert/strict";
import { test } from "node:test";

import { ETENDUE_GROUPE_CARTE } from "~/contenus/regroupement-carte";
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

test("deux amas plus proches que l'écart du niveau ne se touchent que si les réunir ferait une bulle trop étendue", () => {
  const projetes = projeter(creerPointsFrance(3000, 32));
  let refus = 0;
  let paires = 0;
  for (const niveau of [9, 12, 15]) {
    const ecart = 2 ** -niveau;
    const amas = formerAmasCarte(projetes, niveau);
    const centre = (membres) => ({ x: membres.reduce((s, m) => s + m.x, 0) / membres.length, y: membres.reduce((s, m) => s + m.y, 0) / membres.length });
    const centres = amas.map((un) => centre(un.membres));
    for (let i = 0; i < amas.length; i++) {
      for (let j = i + 1; j < amas.length; j++) {
        paires += 1;
        if (Math.hypot(centres[i].x - centres[j].x, centres[i].y - centres[j].y) >= ecart) continue;
        const ensemble = [...amas[i].membres, ...amas[j].membres];
        const milieu = centre(ensemble);
        const etendue = Math.max(...ensemble.map((m) => Math.hypot(m.x - milieu.x, m.y - milieu.y)));
        assert.ok(etendue > ecart * ETENDUE_GROUPE_CARTE, `niveau ${niveau} : amas ${i} et ${j} trop proches alors qu'ils tiendraient ensemble`);
        refus += 1;
      }
    }
    for (const un of amas) {
      const milieu = centre(un.membres);
      for (const m of un.membres) assert.ok(Math.hypot(m.x - milieu.x, m.y - milieu.y) <= ecart * 1.5, `niveau ${niveau} : un lieu loin de son amas`);
    }
  }
  assert.ok(refus < paires / 1000);
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
