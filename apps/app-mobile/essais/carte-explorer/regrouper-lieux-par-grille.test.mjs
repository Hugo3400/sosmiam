import assert from "node:assert/strict";
import { test } from "node:test";

import {
  METRES_PAR_POINT_RUE,
  PLAFOND_MARQUEURS_CARTE,
  PLAFOND_PRIORITAIRES_CARTE,
  SEUIL_SANS_GROUPE_CARTE,
} from "~/contenus/regroupement-carte";
import { regrouperLieuxParGrille } from "~/fonctions/geo/regrouper-lieux-par-grille";

import { MARSEILLE, TAILLE_TELEPHONE, compterMarqueurs, creerHasard, creerPointsFrance, regionAutour } from "./donnees.mjs";

const FRANCE = { latitude: 46.6, longitude: 2.4, latitudeDelta: 10, longitudeDelta: 12 };
const PACA = { latitude: 43.9, longitude: 6.0, latitudeDelta: 2.6, longitudeDelta: 3.6 };
const LYON = { latitude: 45.76, longitude: 4.835 };
const VUES = [
  ["France", FRANCE],
  ["PACA", PACA],
  ["Marseille 5 km", regionAutour(MARSEILLE, 10_000)],
  ["Marseille ville", regionAutour(MARSEILLE, 4_000)],
  ["Marseille 1 km", regionAutour(MARSEILLE, 1_000)],
  ["Vieux-Port", regionAutour({ latitude: 43.2951, longitude: 5.3745 }, 300)],
  ["Lyon", regionAutour(LYON, 8_000)],
  ["Atlantique", { latitude: 46, longitude: -8, latitudeDelta: 2, longitudeDelta: 2 }],
];

function dansLaFenetre(point, region, taille = TAILLE_TELEPHONE) {
  const degresParPoint = region.longitudeDelta / taille.largeur;
  const cos = Math.cos((region.latitude * Math.PI) / 180);
  const demiLatitude = Math.max(region.latitudeDelta, degresParPoint * cos * taille.hauteur);
  return Math.abs(point.latitude - region.latitude) <= demiLatitude && Math.abs(point.longitude - region.longitude) <= region.longitudeDelta;
}

function dansLaVue(point, region) {
  return Math.abs(point.latitude - region.latitude) <= region.latitudeDelta / 2 && Math.abs(point.longitude - region.longitude) <= region.longitudeDelta / 2;
}

function idsMontres(resultat) {
  return [...resultat.seuls.map((s) => s.id), ...resultat.groupes.flatMap((g) => g.ids)];
}

function metresParPoint(region, taille = TAILLE_TELEPHONE) {
  return (region.longitudeDelta / taille.largeur) * 111_320 * Math.cos((region.latitude * Math.PI) / 180);
}

for (const nombre of [300, 1622, 3000, 10_000]) {
  test(`jamais plus de ${PLAFOND_MARQUEURS_CARTE} marqueurs, ${nombre} lieux`, () => {
    const points = creerPointsFrance(nombre, nombre);
    for (const [nom, region] of VUES) {
      for (const selection of [null, points[7].id, points[nombre - 1].id]) {
        const resultat = regrouperLieuxParGrille(points, region, TAILLE_TELEPHONE, selection);
        assert.ok(compterMarqueurs(resultat) <= PLAFOND_MARQUEURS_CARTE, `${nom} : ${compterMarqueurs(resultat)} marqueurs`);
      }
    }
  });
}

test("aucun lieu de la fenêtre ne disparaît : chacun est seul ou dans un groupe, une seule fois", () => {
  const points = creerPointsFrance(3000, 11);
  for (const [nom, region] of VUES) {
    const resultat = regrouperLieuxParGrille(points, region, TAILLE_TELEPHONE, null);
    const montres = idsMontres(resultat);
    assert.equal(new Set(montres).size, montres.length, `${nom} : un lieu montré deux fois`);
    if (metresParPoint(region) <= METRES_PAR_POINT_RUE) continue;
    const attendus = points.filter((p) => dansLaFenetre(p, region)).map((p) => p.id);
    assert.deepEqual([...montres].sort((a, b) => a - b), attendus.sort((a, b) => a - b), nom);
  }
});

test("au zoom rue, sans groupe, tous les lieux vraiment à l'écran sont là", () => {
  const points = creerPointsFrance(3000, 12);
  const region = regionAutour(MARSEILLE, 250);
  const resultat = regrouperLieuxParGrille(points, region, TAILLE_TELEPHONE, null);
  assert.equal(resultat.groupes.length, 0);
  const montres = new Set(resultat.seuls.map((s) => s.id));
  for (const p of points.filter((p) => dansLaVue(p, region))) assert.ok(montres.has(p.id), `lieu ${p.id} à l'écran mais absent`);
});

test("le lieu sélectionné est toujours seul, même loin de la vue ou dans un groupe", () => {
  const points = creerPointsFrance(1622, 13);
  for (const [nom, region] of VUES) {
    for (const choisi of [points[0], points[500], points[1621]]) {
      const resultat = regrouperLieuxParGrille(points, region, TAILLE_TELEPHONE, choisi.id);
      assert.ok(resultat.seuls.some((s) => s.id === choisi.id), `${nom} : sélection ${choisi.id} absente`);
      assert.ok(!resultat.groupes.some((g) => g.ids.includes(choisi.id)), `${nom} : sélection ${choisi.id} dans un groupe`);
    }
  }
});

test("les SOS et les alertes restent seuls, jusqu'à leur propre plafond", () => {
  const points = creerPointsFrance(1622, 14, { partPrioritaires: 0.05 });
  const resultat = regrouperLieuxParGrille(points, FRANCE, TAILLE_TELEPHONE, null);
  const seuls = new Set(resultat.seuls.map((s) => s.id));
  const prioritairesSeuls = points.filter((p) => p.prioritaire && seuls.has(p.id)).length;
  assert.equal(prioritairesSeuls, Math.min(PLAFOND_PRIORITAIRES_CARTE, points.filter((p) => p.prioritaire).length));
  const tousPrioritaires = creerPointsFrance(1622, 15, { partPrioritaires: 1 });
  const plein = regrouperLieuxParGrille(tousPrioritaires, FRANCE, TAILLE_TELEPHONE, tousPrioritaires[3].id);
  assert.ok(compterMarqueurs(plein) <= PLAFOND_MARQUEURS_CARTE);
  assert.ok(plein.seuls.some((s) => s.id === tousPrioritaires[3].id));
  const proche = regrouperLieuxParGrille(points, regionAutour(MARSEILLE, 10_000), TAILLE_TELEPHONE, null);
  const seulsProches = new Set(proche.seuls.map((s) => s.id));
  for (const p of points.filter((p) => p.prioritaire && dansLaFenetre(p, regionAutour(MARSEILLE, 10_000)))) {
    assert.ok(seulsProches.has(p.id), `SOS ${p.id} regroupé à 5 km`);
  }
});

test("ordre fixe : seuls triés par id, groupes par clé, quel que soit l'ordre de la liste", () => {
  const points = creerPointsFrance(1622, 16);
  const hasard = creerHasard(99);
  const melanges = [...points].map((p) => ({ p, t: hasard() })).sort((a, b) => a.t - b.t).map(({ p }) => p);
  for (const [nom, region] of VUES) {
    const a = regrouperLieuxParGrille(points, region, TAILLE_TELEPHONE, points[42].id);
    const b = regrouperLieuxParGrille(melanges, region, TAILLE_TELEPHONE, points[42].id);
    assert.deepEqual(a, b, nom);
    assert.deepEqual(a.seuls.map((s) => s.id), [...a.seuls.map((s) => s.id)].sort((x, y) => x - y));
    assert.deepEqual(a.groupes.map((g) => g.cle), [...a.groupes.map((g) => g.cle)].sort());
  }
});

test("clés stables : glisser un peu la carte garde les mêmes groupes au milieu", () => {
  const points = creerPointsFrance(3000, 17);
  const region = regionAutour(MARSEILLE, 12_000);
  const glissee = { ...region, latitude: region.latitude + region.latitudeDelta * 0.15, longitude: region.longitude - region.longitudeDelta * 0.15 };
  const avant = regrouperLieuxParGrille(points, region, TAILLE_TELEPHONE, null);
  const apres = regrouperLieuxParGrille(points, glissee, TAILLE_TELEPHONE, null);
  assert.ok(avant.groupes.length > 0);
  const parCle = new Map(apres.groupes.map((g) => [g.cle, g]));
  const auMilieu = avant.groupes.filter((g) => dansLaVue(g, { ...region, latitudeDelta: region.latitudeDelta / 2, longitudeDelta: region.longitudeDelta / 2 }));
  assert.ok(auMilieu.length > 0);
  for (const g of auMilieu) assert.deepEqual(parCle.get(g.cle)?.ids, g.ids, `groupe ${g.cle}`);
});

test(`sous ${SEUIL_SANS_GROUPE_CARTE} lieux, pas de grille : seuls les lieux posés au même endroit sont réunis`, () => {
  const points = creerPointsFrance(80, 18, { partMemePlace: 0.2 });
  const resultat = regrouperLieuxParGrille(points, FRANCE, TAILLE_TELEPHONE, null);
  assert.ok(resultat.groupes.length > 0);
  for (const g of resultat.groupes) {
    assert.match(g.cle, /^place:/);
    const membres = points.filter((p) => g.ids.includes(p.id));
    assert.ok(membres.every((m) => m.latitude.toFixed(5) === membres[0].latitude.toFixed(5) && m.longitude.toFixed(5) === membres[0].longitude.toFixed(5)));
  }
  assert.equal(idsMontres(resultat).length, points.length);
});

test("au zoom rue, les lieux posés au même endroit sont écartés, chacun touchable", () => {
  const base = { latitude: 43.2951, longitude: 5.3745 };
  const points = [1, 2, 3, 4, 5, 6].map((id) => ({ id, ...base, prioritaire: false }));
  const region = regionAutour(base, 250);
  const resultat = regrouperLieuxParGrille(points, region, TAILLE_TELEPHONE, 4);
  assert.equal(resultat.groupes.length, 0);
  assert.equal(resultat.seuls.length, 6);
  const degresParPoint = region.longitudeDelta / TAILLE_TELEPHONE.largeur;
  const cos = Math.cos((base.latitude * Math.PI) / 180);
  for (const a of resultat.seuls) {
    for (const b of resultat.seuls) {
      if (a.id >= b.id) continue;
      const dx = (a.longitude - b.longitude) / degresParPoint;
      const dy = (a.latitude - b.latitude) / (degresParPoint * cos);
      assert.ok(Math.hypot(dx, dy) >= 40, `${a.id} et ${b.id} à ${Math.hypot(dx, dy).toFixed(1)} points`);
    }
    const dx = (a.longitude - base.longitude) / degresParPoint;
    const dy = (a.latitude - base.latitude) / (degresParPoint * cos);
    assert.ok(Math.hypot(dx, dy) <= 60, `lieu ${a.id} trop loin de sa vraie place`);
  }
});

test("des points sans position valable ne cassent rien", () => {
  const points = [
    { id: 1, latitude: Number.NaN, longitude: 5, prioritaire: false },
    { id: 2, latitude: 43.3, longitude: 5.37, prioritaire: false },
  ];
  const resultat = regrouperLieuxParGrille(points, regionAutour(MARSEILLE, 10_000), { largeur: 0, hauteur: 0 }, null);
  assert.deepEqual(resultat.seuls.map((s) => s.id), [2]);
  assert.deepEqual(regrouperLieuxParGrille([], FRANCE, TAILLE_TELEPHONE, 3), { seuls: [], groupes: [] });
});
