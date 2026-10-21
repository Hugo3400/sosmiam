import assert from "node:assert/strict";
import { test } from "node:test";

import { MARGE_VUE_CARTE, METRES_PAR_POINT_RUE, PLAFOND_MARQUEURS_CARTE } from "~/contenus/regroupement-carte";
import { regrouperLieuxCarte } from "~/fonctions/geo/regrouper-lieux-carte";

import { TAILLE_IPAD, TAILLE_TELEPHONE, compterMarqueurs, creerPointsDenses, dansLaVue, metresParPoint, regionAutour, verifierSortie, versEcran } from "./donnees.mjs";

const VIEUX_PORT = { latitude: 43.2951, longitude: 5.3745 };

function decaler(centre, est, nord) {
  return { latitude: centre.latitude + nord / 111_320, longitude: centre.longitude + est / (111_320 * Math.cos((centre.latitude * Math.PI) / 180)) };
}

test("au zoom rue sur iPad, à la densité du centre de Marseille (300 lieux sur 1,2 km), aucun lieu de la vue n'est perdu : la fenêtre se resserre, puis de petites bulles", () => {
  const points = [...creerPointsDenses(300, VIEUX_PORT, 680, 41), ...creerPointsDenses(400, VIEUX_PORT, 4_000, 42, { premierId: 10_000 })];
  let resserrees = 0;
  let avecBulles = 0;
  for (const metresParPointVoulus of [0.45, 0.6, 0.7, 0.79]) {
    for (const [est, nord] of [
      [0, 0],
      [300, 0],
      [0, -300],
      [-250, 250],
    ]) {
      const region = regionAutour(decaler(VIEUX_PORT, est, nord), metresParPointVoulus * TAILLE_IPAD.largeur, TAILLE_IPAD);
      assert.ok(metresParPoint(region, TAILLE_IPAD) <= METRES_PAR_POINT_RUE);
      const nom = `${metresParPointVoulus} m par point, ${est} m à l'est, ${nord} m au nord`;
      const resultat = regrouperLieuxCarte(points, region, TAILLE_IPAD, null);
      const vus = verifierSortie(resultat, nom);
      assert.ok(compterMarqueurs(resultat) <= PLAFOND_MARQUEURS_CARTE, `${nom} : ${compterMarqueurs(resultat)} marqueurs`);
      for (const p of points.filter((p) => dansLaVue(p, region))) assert.ok(vus.has(p.id), `${nom} : lieu ${p.id} à l'écran sans marqueur ni bulle`);
      if (resultat.marge < MARGE_VUE_CARTE) resserrees += 1;
      if (resultat.groupes.length > 0) {
        avecBulles += 1;
        assert.equal(resultat.marge, 0, `${nom} : des bulles avant d'avoir resserré la fenêtre`);
        assert.ok(compterMarqueurs(resultat) >= PLAFOND_MARQUEURS_CARTE * 0.75, `${nom} : ${compterMarqueurs(resultat)} marqueurs, trop regroupé pour un zoom rue`);
      }
    }
  }
  assert.ok(resserrees > 0, "la fenêtre ne se resserre jamais");
  assert.ok(avecBulles > 0, "jamais de bulle : la vue ne déborde jamais du plafond");
});

test("au zoom rue, quand tout tient sous le plafond, la fenêtre garde sa marge et rien n'est regroupé", () => {
  const points = creerPointsDenses(120, VIEUX_PORT, 600, 44);
  const region = regionAutour(VIEUX_PORT, 250);
  const resultat = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, null);
  verifierSortie(resultat, "peu de lieux");
  assert.equal(resultat.marge, MARGE_VUE_CARTE);
  assert.equal(resultat.groupes.length, 0);
});

test("au zoom rue, des lieux très proches s'écartent d'un rayon au plus : chacun reste sur sa vraie place, et ils ne se chevauchent plus", () => {
  const proches = [0, 1, 2].map((rang) => ({ id: rang + 1, ...decaler(VIEUX_PORT, rang * 2, (rang % 2) * 3), prioritaire: false }));
  const region = regionAutour(VIEUX_PORT, 250);
  const resultat = regrouperLieuxCarte(proches, region, TAILLE_TELEPHONE, null);
  verifierSortie(resultat, "trois voisins");
  assert.equal(resultat.groupes.length, 0);
  const montres = new Map(resultat.seuls.map((s) => [s.id, versEcran(region, s)]));
  for (const p of proches) {
    const vraie = versEcran(region, p);
    const ecart = Math.hypot(montres.get(p.id).x - vraie.x, montres.get(p.id).y - vraie.y);
    assert.ok(ecart <= 20 + 1e-6, `lieu ${p.id} à ${ecart.toFixed(1)} points de sa vraie place`);
  }
  for (const a of proches) {
    for (const b of proches) {
      if (a.id >= b.id) continue;
      const ecart = Math.hypot(montres.get(a.id).x - montres.get(b.id).x, montres.get(a.id).y - montres.get(b.id).y);
      assert.ok(ecart >= 36, `${a.id} et ${b.id} à ${ecart.toFixed(1)} points`);
    }
  }
});
