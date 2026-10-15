import assert from "node:assert/strict";
import { test } from "node:test";

import { METRES_PAR_POINT_RUE } from "~/contenus/regroupement-carte";
import { calculerDemiCoteRue } from "~/fonctions/geo/calculer-demi-cote-rue";
import { estRegionAssezChangee } from "~/fonctions/geo/est-region-assez-changee";
import { regrouperLieuxParGrille } from "~/fonctions/geo/regrouper-lieux-par-grille";

import { MARSEILLE, TAILLE_TELEPHONE, coinsAutour, creerPointsFrance, regionAutour, simulerCadrage } from "./donnees.mjs";

const MARGE_CADRE = 40;
const FEUILLES = [
  { nom: "feuille repliée", haut: 130, bas: 180 },
  { nom: "feuille à moitié", haut: 130, bas: 330 },
  { nom: "feuille dépliée", haut: 160, bas: 372 },
];

function toucherGroupe(groupe, points, marges) {
  const parId = new Map(points.map((p) => [p.id, p]));
  const membres = groupe.ids.map((id) => parId.get(id));
  const cote = Math.min(TAILLE_TELEPHONE.largeur - MARGE_CADRE * 2, TAILLE_TELEPHONE.hauteur - marges.haut - marges.bas - MARGE_CADRE * 2);
  return simulerCadrage(coinsAutour(membres, calculerDemiCoteRue(cote)), TAILLE_TELEPHONE, { ...marges, marge: MARGE_CADRE });
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
      const depart = regrouperLieuxParGrille(points, vue, TAILLE_TELEPHONE, null);
      for (const groupe of depart.groupes) {
        let actuel = groupe;
        let essais = 0;
        for (;;) {
          const region = toucherGroupe(actuel, points, marges);
          const apres = regrouperLieuxParGrille(points, region, TAILLE_TELEPHONE, null);
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

test("lieux au même endroit : un toucher amène au zoom rue, où ils sont écartés et tous visibles", () => {
  const base = { latitude: 43.2951, longitude: 5.3745 };
  const voisins = creerPointsFrance(1622, 22);
  const memePlace = [90001, 90002, 90003, 90004].map((id) => ({ id, ...base, prioritaire: false }));
  const points = [...voisins, ...memePlace];
  for (const marges of FEUILLES) {
    const vue = regrouperLieuxParGrille(points, regionAutour(MARSEILLE, 10_000), TAILLE_TELEPHONE, null);
    const groupe = vue.groupes.find((g) => memePlace.every((p) => g.ids.includes(p.id)));
    assert.ok(groupe);
    const region = toucherGroupe(groupe, points, marges);
    const metres = (region.longitudeDelta / TAILLE_TELEPHONE.largeur) * 111_320 * Math.cos((region.latitude * Math.PI) / 180);
    assert.ok(metres <= METRES_PAR_POINT_RUE, `${marges.nom} : ${metres.toFixed(2)} m par point`);
    const apres = regrouperLieuxParGrille(points, region, TAILLE_TELEPHONE, null);
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
