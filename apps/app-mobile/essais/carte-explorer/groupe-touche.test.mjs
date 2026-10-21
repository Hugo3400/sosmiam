import assert from "node:assert/strict";
import { test } from "node:test";

import { MARGE_CADRE_CARTE, METRES_PAR_POINT_RUE } from "~/contenus/regroupement-carte";
import { calculerCoinsAutour } from "~/fonctions/geo/calculer-coins-autour";
import { calculerDemiCoteRue } from "~/fonctions/geo/calculer-demi-cote-rue";
import { estRegionAssezChangee } from "~/fonctions/geo/est-region-assez-changee";
import { regrouperLieuxCarte } from "~/fonctions/geo/regrouper-lieux-carte";

import { MARSEILLE, TAILLE_TELEPHONE, creerPointsDenses, creerPointsFrance, regionAutour, simulerCadrage, verifierSortie } from "./donnees.mjs";

const MONTPELLIER = { latitude: 43.6108, longitude: 3.8767 };
const FEUILLES = [
  { nom: "feuille repliée", haut: 130, bas: 180 },
  { nom: "feuille à moitié", haut: 130, bas: 330 },
  { nom: "feuille dépliée", haut: 160, bas: 372 },
];

function toucherGroupe(groupe, points, marges) {
  const parId = new Map(points.map((p) => [p.id, p]));
  const membres = groupe.ids.map((id) => parId.get(id));
  const cote = Math.min(TAILLE_TELEPHONE.largeur - MARGE_CADRE_CARTE * 2, TAILLE_TELEPHONE.hauteur - marges.haut - marges.bas - MARGE_CADRE_CARTE * 2);
  return simulerCadrage(calculerCoinsAutour(membres, calculerDemiCoteRue(cote)), TAILLE_TELEPHONE, { ...marges, marge: MARGE_CADRE_CARTE });
}

function resteEntier(groupe, resultat) {
  return resultat.groupes.some((g) => groupe.ids.every((id) => g.ids.includes(id)));
}

test("un groupe touché s'ouvre toujours, même quand ses lieux sont au même endroit", () => {
  const points = creerPointsFrance(1622, 21, { partMemePlace: 0.08 });
  const vues = [
    { latitude: 46.6, longitude: 2.4, latitudeDelta: 10, longitudeDelta: 12 },
    regionAutour(MARSEILLE, 10_000),
    regionAutour(MARSEILLE, 3_000),
    regionAutour(MARSEILLE, 900),
  ];
  let touches = 0;
  for (const marges of FEUILLES) {
    for (const vue of vues) {
      const depart = regrouperLieuxCarte(points, vue, TAILLE_TELEPHONE, null);
      for (const groupe of depart.groupes) {
        let actuel = groupe;
        let essais = 0;
        for (;;) {
          const region = toucherGroupe(actuel, points, marges);
          const apres = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, null);
          touches += 1;
          essais += 1;
          if (!resteEntier(actuel, apres)) break;
          assert.ok(essais < 8, `${marges.nom} : le groupe ${groupe.cle} (${groupe.nombre} lieux) ne s'ouvre pas`);
          actuel = apres.groupes.find((g) => actuel.ids.every((id) => g.ids.includes(id)));
        }
        assert.equal(essais, 1, `${marges.nom} : le groupe ${groupe.cle} demande ${essais} touchers`);
      }
    }
  }
  assert.ok(touches > 50);
});

test("lieux au même endroit : quelques touchers mènent au zoom rue, où ils sont écartés et tous visibles", () => {
  const base = { latitude: 43.2951, longitude: 5.3745 };
  const voisins = creerPointsFrance(1622, 22);
  const memePlace = [90001, 90002, 90003, 90004].map((id) => ({ id, ...base, prioritaire: false }));
  const points = [...voisins, ...memePlace];
  const metresParPoint = (region) => (region.longitudeDelta / TAILLE_TELEPHONE.largeur) * 111_320 * Math.cos((region.latitude * Math.PI) / 180);
  for (const marges of FEUILLES) {
    let vue = regionAutour(MARSEILLE, 10_000);
    let touchers = 0;
    for (;;) {
      const resultat = regrouperLieuxCarte(points, vue, TAILLE_TELEPHONE, null);
      const groupe = resultat.groupes.find((g) => memePlace.every((p) => g.ids.includes(p.id)));
      if (!groupe) break;
      vue = toucherGroupe(groupe, points, marges);
      touchers += 1;
      assert.ok(touchers <= 4, `${marges.nom} : toujours dans une bulle après ${touchers} touchers`);
    }
    assert.ok(metresParPoint(vue) <= METRES_PAR_POINT_RUE, `${marges.nom} : ${metresParPoint(vue).toFixed(2)} m par point`);
    const apres = regrouperLieuxCarte(points, vue, TAILLE_TELEPHONE, null);
    const seuls = apres.seuls.filter((s) => memePlace.some((p) => p.id === s.id));
    assert.equal(seuls.length, 4, marges.nom);
    assert.equal(new Set(seuls.map((s) => `${s.latitude},${s.longitude}`)).size, 4);
  }
});

test("demi-côté du zoom rue : la vue obtenue reste sous le seuil sans grille", () => {
  for (const cote of [80, 160, 310, 600]) {
    const demi = calculerDemiCoteRue(cote);
    const metresParPoint = (demi * 2 * 111_320) / cote;
    assert.ok(metresParPoint < METRES_PAR_POINT_RUE, `${cote} points : ${metresParPoint}`);
    assert.ok(metresParPoint > METRES_PAR_POINT_RUE / 3, `${cote} points : trop près`);
  }
  assert.ok(calculerDemiCoteRue(-20) > 0);
  assert.ok(Number.isFinite(calculerDemiCoteRue(Number.NaN)));
});

test("la carte ne se regroupe à nouveau qu'après un vrai déplacement ou un vrai zoom", () => {
  const vue = regionAutour(MARSEILLE, 10_000);
  assert.equal(estRegionAssezChangee(null, vue), true);
  assert.equal(estRegionAssezChangee(vue, vue), false);
  assert.equal(estRegionAssezChangee(vue, { ...vue, latitude: vue.latitude + vue.latitudeDelta * 0.1 }), false);
  assert.equal(estRegionAssezChangee(vue, { ...vue, longitude: vue.longitude - vue.longitudeDelta * 0.25 }), true);
  assert.equal(estRegionAssezChangee(vue, { ...vue, latitudeDelta: vue.latitudeDelta * 1.3, longitudeDelta: vue.longitudeDelta * 1.3 }), false);
  assert.equal(estRegionAssezChangee(vue, { ...vue, latitudeDelta: vue.latitudeDelta / 1.5, longitudeDelta: vue.longitudeDelta / 1.5 }), true);
  assert.equal(estRegionAssezChangee(vue, { ...vue, longitudeDelta: 0 }), false);
  assert.equal(estRegionAssezChangee(vue, { ...vue, latitude: Number.NaN }), false);
  assert.equal(estRegionAssezChangee({ ...vue, latitudeDelta: -1 }, vue), true);
});

test("zoom arrière et glissement ensemble : la carte se regroupe à nouveau, aucun lieu du bord ne reste sans marqueur", () => {
  const points = [...creerPointsDenses(2500, MARSEILLE, 6_000, 31), ...creerPointsDenses(600, MONTPELLIER, 4_000, 32, { premierId: 10_000 })];
  for (const centre of [MARSEILLE, MONTPELLIER]) {
    for (const metres of [2_000, 5_000, 10_000]) {
      const avant = regionAutour(centre, metres);
      for (const [zoom, glisse] of [
        [1.39, 0.19],
        [1.3, 0.15],
        [1.45, 0.2],
        [0.72, 0.19],
        [1, 0.19],
        [1.39, 0],
      ]) {
        const apres = { latitude: avant.latitude - avant.latitudeDelta * glisse, longitude: avant.longitude + avant.longitudeDelta * glisse, latitudeDelta: avant.latitudeDelta * zoom, longitudeDelta: avant.longitudeDelta * zoom };
        const vue = estRegionAssezChangee(avant, apres) ? apres : avant;
        const vus = verifierSortie(regrouperLieuxCarte(points, vue, TAILLE_TELEPHONE, null), "bord");
        const aLEcran = points.filter((p) => Math.abs(p.latitude - apres.latitude) <= apres.latitudeDelta / 2 && Math.abs(p.longitude - apres.longitude) <= apres.longitudeDelta / 2);
        const perdus = aLEcran.filter((p) => !vus.has(p.id));
        assert.equal(perdus.length, 0, `${metres} m, zoom ×${zoom}, glissé de ${glisse * 100} % : ${perdus.length} lieux sans marqueur`);
      }
    }
  }
  const vue = regionAutour(MARSEILLE, 10_000);
  assert.equal(estRegionAssezChangee(vue, { ...vue, latitude: vue.latitude - vue.latitudeDelta * 0.19, longitude: vue.longitude + vue.longitudeDelta * 0.19, latitudeDelta: vue.latitudeDelta * 1.39, longitudeDelta: vue.longitudeDelta * 1.39 }), true);
});
