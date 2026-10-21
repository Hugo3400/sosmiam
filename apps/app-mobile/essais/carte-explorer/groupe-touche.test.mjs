import assert from "node:assert/strict";
import { test } from "node:test";

import { MARGE_CADRE_CARTE, METRES_PAR_POINT_RUE } from "~/contenus/regroupement-carte";
import { calculerCoinsAutour } from "~/fonctions/geo/calculer-coins-autour";
import { calculerDemiCoteRue } from "~/fonctions/geo/calculer-demi-cote-rue";
import { estRegionAssezChangee } from "~/fonctions/geo/est-region-assez-changee";
import { regrouperLieuxCarte } from "~/fonctions/geo/regrouper-lieux-carte";

import { MARSEILLE, TAILLE_IPAD, TAILLE_TELEPHONE, creerPointsDenses, creerPointsFrance, metresParPoint, regionAutour, simulerCadrage, verifierSortie } from "./donnees.mjs";

const MONTPELLIER = { latitude: 43.6108, longitude: 3.8767 };
const FEUILLES = [
  { nom: "feuille repliée", haut: 130, bas: 180 },
  { nom: "feuille à moitié", haut: 130, bas: 330 },
  { nom: "feuille dépliée", haut: 160, bas: 372 },
];

function toucherGroupe(groupe, points, marges, vue, taille = TAILLE_TELEPHONE) {
  const parId = new Map(points.map((p) => [p.id, p]));
  const membres = groupe.ids.map((id) => parId.get(id));
  const cote = Math.min(taille.largeur - MARGE_CADRE_CARTE * 2, taille.hauteur - marges.haut - marges.bas - MARGE_CADRE_CARTE * 2);
  return simulerCadrage(calculerCoinsAutour(membres, calculerDemiCoteRue(cote, metresParPoint(vue, taille))), taille, { ...marges, marge: MARGE_CADRE_CARTE });
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
        let ici = vue;
        let essais = 0;
        for (;;) {
          const region = toucherGroupe(actuel, points, marges, ici);
          ici = region;
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
      vue = toucherGroupe(groupe, points, marges, vue);
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
  assert.equal(calculerDemiCoteRue(300, 10), calculerDemiCoteRue(300));
  assert.equal(calculerDemiCoteRue(300, Number.NaN), calculerDemiCoteRue(300));
  const auZoomRue = calculerDemiCoteRue(300, 0.6);
  assert.ok(Math.abs((auZoomRue * 2 * 111_320) / 300 - 0.3) < 1e-9, "au zoom rue, deux fois plus près que la vue d'avant");
});

test("au zoom rue très dense, toucher une bulle zoome au moins deux fois plus près : elle finit toujours par s'ouvrir", () => {
  const points = creerPointsDenses(1500, { latitude: 43.2951, longitude: 5.3745 }, 300, 43);
  const marges = { haut: 170, bas: 330 };
  const vue = regionAutour({ latitude: 43.2951, longitude: 5.3745 }, 0.78 * TAILLE_IPAD.largeur, TAILLE_IPAD);
  const depart = regrouperLieuxCarte(points, vue, TAILLE_IPAD, null);
  verifierSortie(depart, "zoom rue très dense");
  assert.ok(depart.groupes.length > 10, "des bulles au zoom rue");
  for (const groupe of depart.groupes.slice(0, 20)) {
    let actuel = groupe;
    let ici = vue;
    let touchers = 0;
    for (;;) {
      const region = toucherGroupe(actuel, points, marges, ici, TAILLE_IPAD);
      assert.ok(metresParPoint(region, TAILLE_IPAD) <= metresParPoint(ici, TAILLE_IPAD) / 2 + 1e-9, "pas assez près");
      const apres = regrouperLieuxCarte(points, region, TAILLE_IPAD, null);
      touchers += 1;
      if (!resteEntier(actuel, apres)) break;
      assert.ok(touchers < 5, `la bulle ${groupe.cle} (${groupe.nombre} lieux) reste fermée après ${touchers} touchers`);
      actuel = apres.groupes.find((g) => actuel.ids.every((id) => g.ids.includes(id)));
      ici = region;
    }
  }
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
  const glisseUnPeu = { ...vue, longitude: vue.longitude + vue.longitudeDelta * 0.05 };
  assert.equal(estRegionAssezChangee(vue, glisseUnPeu), false);
  assert.equal(estRegionAssezChangee(vue, glisseUnPeu, 0), true, "fenêtre resserrée : le moindre glissement relance le calcul");
  assert.equal(estRegionAssezChangee(vue, { ...vue, latitudeDelta: vue.latitudeDelta / 1.2, longitudeDelta: vue.longitudeDelta / 1.2 }, 0), false);
  assert.equal(estRegionAssezChangee(vue, { ...vue, latitudeDelta: vue.latitudeDelta * 1.1, longitudeDelta: vue.longitudeDelta * 1.1 }, 0), true);
});

test("zoom arrière et glissement ensemble : la carte se regroupe à nouveau, aucun lieu du bord ne reste sans marqueur", () => {
  const points = [...creerPointsDenses(2500, MARSEILLE, 6_000, 31), ...creerPointsDenses(600, MONTPELLIER, 4_000, 32, { premierId: 10_000 })];
  let cas = 0;
  for (const centre of [MARSEILLE, MONTPELLIER]) {
    for (const metres of [500, 2_000, 5_000, 10_000]) {
      const avant = regionAutour(centre, metres);
      const marge = regrouperLieuxCarte(points, avant, TAILLE_TELEPHONE, null).marge;
      for (const [zoom, glisse] of [
        [1.39, 0.19],
        [1.3, 0.15],
        [1.45, 0.2],
        [0.72, 0.19],
        [1, 0.19],
        [1.39, 0],
      ]) {
        for (const [versEst, versNord] of [
          [1, -1],
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const apres = {
            latitude: avant.latitude + avant.latitudeDelta * glisse * versNord,
            longitude: avant.longitude + avant.longitudeDelta * glisse * versEst,
            latitudeDelta: avant.latitudeDelta * zoom,
            longitudeDelta: avant.longitudeDelta * zoom,
          };
          const vue = estRegionAssezChangee(avant, apres, marge) ? apres : avant;
          const vus = verifierSortie(regrouperLieuxCarte(points, vue, TAILLE_TELEPHONE, null), "bord");
          const aLEcran = points.filter((p) => Math.abs(p.latitude - apres.latitude) <= apres.latitudeDelta / 2 && Math.abs(p.longitude - apres.longitude) <= apres.longitudeDelta / 2);
          const perdus = aLEcran.filter((p) => !vus.has(p.id));
          cas += 1;
          assert.equal(perdus.length, 0, `${metres} m, zoom ×${zoom}, glissé de ${glisse * 100} % (${versEst}, ${versNord}) : ${perdus.length} lieux sans marqueur`);
        }
      }
    }
  }
  assert.equal(cas, 240);
  const vue = regionAutour(MARSEILLE, 10_000);
  assert.equal(estRegionAssezChangee(vue, { ...vue, latitude: vue.latitude - vue.latitudeDelta * 0.19, longitude: vue.longitude + vue.longitudeDelta * 0.19, latitudeDelta: vue.latitudeDelta * 1.39, longitudeDelta: vue.longitudeDelta * 1.39 }), true);
});
