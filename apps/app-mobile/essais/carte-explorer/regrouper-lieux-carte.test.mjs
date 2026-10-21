import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ECART_MARQUEURS_POINTS,
  ETENDUE_GROUPE_CARTE,
  MARGE_VUE_CARTE,
  METRES_PAR_POINT_RUE,
  PLAFOND_MARQUEURS_CARTE,
  PLAFOND_PRIORITAIRES_CARTE,
} from "~/contenus/regroupement-carte";
import { preparerPointsCarte } from "~/fonctions/geo/preparer-points-carte";
import { regrouperLieuxCarte } from "~/fonctions/geo/regrouper-lieux-carte";

import {
  MARSEILLE,
  TAILLE_IPAD,
  TAILLE_TELEPHONE,
  compterMarqueurs,
  creerHasard,
  creerPointsDenses,
  creerPointsFrance,
  dansLaFenetre,
  dansLaVue,
  metresParPoint,
  regionAutour,
  verifierSortie,
  versEcran,
} from "./donnees.mjs";

const FRANCE = { latitude: 46.6, longitude: 2.4, latitudeDelta: 10, longitudeDelta: 12 };
const PACA = { latitude: 43.9, longitude: 6.0, latitudeDelta: 2.6, longitudeDelta: 3.6 };
const LYON = { latitude: 45.76, longitude: 4.835 };
const VIEUX_PORT = { latitude: 43.2951, longitude: 5.3745 };
const VUES = [
  ["France", FRANCE],
  ["PACA", PACA],
  ["Marseille 5 km", regionAutour(MARSEILLE, 10_000)],
  ["Marseille ville", regionAutour(MARSEILLE, 4_000)],
  ["Marseille 1 km", regionAutour(MARSEILLE, 1_000)],
  ["Vieux-Port", regionAutour(VIEUX_PORT, 300)],
  ["Lyon", regionAutour(LYON, 8_000)],
  ["Atlantique", { latitude: 46, longitude: -8, latitudeDelta: 2, longitudeDelta: 2 }],
];
const ECART_SUR = ECART_MARQUEURS_POINTS * 0.9;

function ecartsTropPetits(resultat, region, taille, idsFixes, seuil) {
  const marqueurs = [...resultat.seuls.filter((seul) => !idsFixes.has(seul.id)), ...resultat.groupes].map((m) => versEcran(region, m, taille));
  let trop = 0;
  for (let a = 0; a < marqueurs.length; a++) {
    for (let b = a + 1; b < marqueurs.length; b++) {
      if (Math.hypot(marqueurs[a].x - marqueurs[b].x, marqueurs[a].y - marqueurs[b].y) < seuil) trop += 1;
    }
  }
  return trop;
}

for (const [nomTaille, taille] of [
  ["téléphone", TAILLE_TELEPHONE],
  ["iPad", TAILLE_IPAD],
]) {
  test(`jamais plus de ${PLAFOND_MARQUEURS_CARTE} marqueurs, sorties toujours propres (${nomTaille})`, () => {
    for (const nombre of [300, 1622, 10_000]) {
      const points = creerPointsFrance(nombre, nombre);
      for (const [nom, region] of VUES) {
        for (const selection of [null, points[7].id, points[nombre - 1].id]) {
          const resultat = regrouperLieuxCarte(points, region, taille, selection);
          verifierSortie(resultat, `${nom}, ${nombre} lieux`);
          assert.ok(compterMarqueurs(resultat) <= PLAFOND_MARQUEURS_CARTE, `${nom} : ${compterMarqueurs(resultat)} marqueurs`);
        }
      }
    }
  });
}

test("le plafond tient même quand la carte en voudrait bien plus : iPad sur un centre-ville très dense, et zoom rue", () => {
  const denses = creerPointsDenses(12_000, VIEUX_PORT, 2_500, 3);
  let maximum = 0;
  for (const metres of [1_200, 2_000, 3_000, 5_000]) {
    const resultat = regrouperLieuxCarte(denses, regionAutour(VIEUX_PORT, metres, TAILLE_IPAD), TAILLE_IPAD, null);
    verifierSortie(resultat, `iPad ${metres} m`);
    maximum = Math.max(maximum, compterMarqueurs(resultat));
    assert.ok(compterMarqueurs(resultat) <= PLAFOND_MARQUEURS_CARTE, `iPad ${metres} m : ${compterMarqueurs(resultat)}`);
  }
  assert.ok(maximum >= PLAFOND_MARQUEURS_CARTE * 0.9, `au plus ${maximum} marqueurs : le plafond ne sert jamais`);
  const rue = regionAutour(VIEUX_PORT, 400, TAILLE_IPAD);
  assert.ok(metresParPoint(rue, TAILLE_IPAD) <= METRES_PAR_POINT_RUE);
  const tresDenses = creerPointsDenses(4_000, VIEUX_PORT, 300, 4);
  const auZoomRue = regrouperLieuxCarte(tresDenses, rue, TAILLE_IPAD, tresDenses[5].id);
  const vus = verifierSortie(auZoomRue, "zoom rue");
  assert.ok(auZoomRue.groupes.length > 0, "trop de lieux pour les montrer un par un : des bulles");
  assert.ok(compterMarqueurs(auZoomRue) <= PLAFOND_MARQUEURS_CARTE, `${compterMarqueurs(auZoomRue)} marqueurs`);
  assert.equal(auZoomRue.marge, 0);
  assert.ok(auZoomRue.seuls.some((seul) => seul.id === tresDenses[5].id));
  for (const p of tresDenses.filter((p) => dansLaVue(p, rue))) assert.ok(vus.has(p.id), `lieu ${p.id} à l'écran sans marqueur ni bulle`);
});

test("aucun lieu de la fenêtre ne disparaît, zoom rue compris : chacun est seul ou dans une bulle, une seule fois", () => {
  const denses = creerPointsDenses(2_500, VIEUX_PORT, 1_500, 5);
  for (const taille of [TAILLE_TELEPHONE, TAILLE_IPAD]) {
    const points = [...creerPointsFrance(3000, 11), ...denses.map((p) => ({ ...p, id: p.id + 100_000 }))];
    const vuesRue = [600, 800, 1_000].map((metres) => [`Vieux-Port ${metres} m`, regionAutour(VIEUX_PORT, metres, taille)]);
    for (const [nom, region] of [...VUES, ...vuesRue]) {
      const resultat = regrouperLieuxCarte(points, region, taille, null);
      const vus = verifierSortie(resultat, nom);
      assert.ok(resultat.marge === MARGE_VUE_CARTE || metresParPoint(region, taille) <= METRES_PAR_POINT_RUE, `${nom} : marge ${resultat.marge} hors du zoom rue`);
      for (const p of points.filter((p) => dansLaFenetre(p, region, taille, resultat.marge))) assert.ok(vus.has(p.id), `${nom} : lieu ${p.id} disparu`);
      const parId = new Map(points.map((p) => [p.id, p]));
      for (const g of resultat.groupes) assert.ok(g.ids.some((id) => dansLaFenetre(parId.get(id), region, taille, resultat.marge)), `${nom} : bulle ${g.cle} hors de la fenêtre`);
    }
  }
});

test("en faisant glisser la carte sur plusieurs zones de calcul, aucun lieu ne se perd et les bulles gardent leur clé", () => {
  const points = creerPointsDenses(6000, MARSEILLE, 60_000, 8);
  let comparees = 0;
  for (const metres of [2_500, 9_000]) {
    const depart = regionAutour(MARSEILLE, metres);
    const liste = points.map((p) => ({ ...p }));
    let clesAvant = new Map();
    for (let pas = 0; pas < 60; pas++) {
      const region = { ...depart, longitude: depart.longitude - depart.longitudeDelta * 15 + depart.longitudeDelta * pas * 0.5, latitude: depart.latitude + depart.latitudeDelta * Math.sin(pas / 7) };
      const resultat = regrouperLieuxCarte(liste, region, TAILLE_TELEPHONE, null);
      const vus = verifierSortie(resultat, `pas ${pas}`);
      for (const p of liste) if (dansLaFenetre(p, region)) assert.ok(vus.has(p.id), `${metres} m, pas ${pas} : lieu ${p.id} perdu`);
      const cles = new Map(resultat.groupes.map((g) => [g.ids.join(","), g.cle]));
      for (const [ids, cle] of cles) {
        if (!clesAvant.has(ids)) continue;
        comparees += 1;
        assert.equal(cle, clesAvant.get(ids), `${metres} m, pas ${pas} : la bulle ${ids.slice(0, 30)} change de clé`);
      }
      clesAvant = cles;
    }
  }
  assert.ok(comparees > 500);
});

test("choisir un lieu dans une bulle le sort de sa bulle, sans toucher aux autres bulles", () => {
  const points = creerPointsFrance(6000, 19);
  const region = regionAutour(MARSEILLE, 10_000);
  const avant = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, null);
  const groupe = [...avant.groupes].sort((a, b) => b.nombre - a.nombre)[0];
  assert.ok(groupe && groupe.nombre > 2);
  const choisi = groupe.ids[1];
  const apres = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, choisi);
  verifierSortie(apres, "après le choix");
  assert.ok(apres.seuls.some((s) => s.id === choisi));
  const parCle = new Map(apres.groupes.map((g) => [g.cle, g]));
  assert.deepEqual(parCle.get(groupe.cle)?.ids, groupe.ids.filter((id) => id !== choisi));
  for (const g of avant.groupes) if (g.cle !== groupe.cle) assert.deepEqual(parCle.get(g.cle)?.ids, g.ids, `bulle ${g.cle}`);
  assert.equal(apres.groupes.length, avant.groupes.length);
  assert.equal(apres.seuls.length, avant.seuls.length + 1);
});

test("une bulle de deux dont on choisit un lieu laisse l'autre seul, jamais une bulle « 1 » ; un lieu isolé choisi ne laisse pas de bulle vide", () => {
  const voisins = [
    { id: 1, latitude: 43.3, longitude: 5.37, prioritaire: false },
    { id: 2, latitude: 43.30005, longitude: 5.37005, prioritaire: false },
    { id: 3, latitude: 43.36, longitude: 5.45, prioritaire: false },
  ];
  const region = regionAutour(MARSEILLE, 20_000);
  const libre = regrouperLieuxCarte(voisins, region, TAILLE_TELEPHONE, null);
  verifierSortie(libre, "sans choix");
  assert.deepEqual(libre.groupes.map((g) => g.ids), [[1, 2]]);
  const unSeul = regrouperLieuxCarte(voisins, region, TAILLE_TELEPHONE, 2);
  verifierSortie(unSeul, "lieu 2 choisi");
  assert.equal(unSeul.groupes.length, 0);
  assert.deepEqual(unSeul.seuls.map((s) => s.id), [1, 2, 3]);
  const isole = regrouperLieuxCarte(voisins, region, TAILLE_TELEPHONE, 3);
  verifierSortie(isole, "lieu isolé choisi");
  assert.deepEqual(isole.groupes.map((g) => g.ids), [[1, 2]]);
  assert.deepEqual(isole.seuls.map((s) => s.id), [3]);
});

test("le lieu choisi est toujours seul, même loin de la vue ou dans une bulle", () => {
  const points = creerPointsFrance(1622, 13);
  for (const [nom, region] of VUES) {
    for (const choisi of [points[0], points[500], points[1621]]) {
      const resultat = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, choisi.id);
      verifierSortie(resultat, nom);
      assert.ok(resultat.seuls.some((s) => s.id === choisi.id), `${nom} : choix ${choisi.id} absent`);
      assert.ok(!resultat.groupes.some((g) => g.ids.includes(choisi.id)), `${nom} : choix ${choisi.id} dans une bulle`);
    }
  }
});

test("les SOS et les alertes restent seuls jusqu'à leur plafond, et ceux d'au-delà ne se perdent pas", () => {
  const points = creerPointsFrance(1622, 14, { partPrioritaires: 0.1 });
  const resultat = regrouperLieuxCarte(points, FRANCE, TAILLE_TELEPHONE, null);
  const vus = verifierSortie(resultat, "France");
  const seuls = new Set(resultat.seuls.map((s) => s.id));
  const prioritairesVus = points.filter((p) => p.prioritaire && dansLaFenetre(p, FRANCE));
  assert.ok(prioritairesVus.length > PLAFOND_PRIORITAIRES_CARTE);
  assert.ok(prioritairesVus.filter((p) => seuls.has(p.id)).length >= PLAFOND_PRIORITAIRES_CARTE);
  for (const p of prioritairesVus) assert.ok(vus.has(p.id), `SOS ${p.id} perdu`);
  const tousPrioritaires = creerPointsFrance(1622, 15, { partPrioritaires: 1 });
  const plein = regrouperLieuxCarte(tousPrioritaires, FRANCE, TAILLE_TELEPHONE, tousPrioritaires[3].id);
  const vusPlein = verifierSortie(plein, "tout en SOS");
  assert.ok(compterMarqueurs(plein) <= PLAFOND_MARQUEURS_CARTE);
  assert.ok(plein.seuls.some((s) => s.id === tousPrioritaires[3].id));
  for (const p of tousPrioritaires.filter((p) => dansLaFenetre(p, FRANCE))) assert.ok(vusPlein.has(p.id), `SOS ${p.id} perdu`);
  const proche = regionAutour(MARSEILLE, 10_000);
  const seulsProches = new Set(regrouperLieuxCarte(points, proche, TAILLE_TELEPHONE, null).seuls.map((s) => s.id));
  for (const p of points.filter((p) => p.prioritaire && dansLaFenetre(p, proche))) assert.ok(seulsProches.has(p.id), `SOS ${p.id} regroupé à 5 km`);
});

test("plus de 60 SOS au zoom rue et sous 120 lieux : tous montrés, jamais plus que le plafond", () => {
  const sos = creerPointsDenses(90, VIEUX_PORT, 120, 6, { partPrioritaires: 1 });
  for (const region of [regionAutour(VIEUX_PORT, 250), regionAutour(VIEUX_PORT, 1_500)]) {
    const resultat = regrouperLieuxCarte(sos, region, TAILLE_TELEPHONE, null);
    const vus = verifierSortie(resultat, "SOS");
    assert.ok(compterMarqueurs(resultat) <= PLAFOND_MARQUEURS_CARTE);
    for (const p of sos) if (dansLaFenetre(p, region)) assert.ok(vus.has(p.id), `SOS ${p.id} perdu`);
  }
});

test("ordre fixe : seuls triés par id, bulles par clé, quel que soit l'ordre de la liste", () => {
  const points = creerPointsFrance(1622, 16);
  const hasard = creerHasard(99);
  const melanges = [...points].map((p) => ({ p, t: hasard() })).sort((a, b) => a.t - b.t).map(({ p }) => ({ ...p }));
  for (const [nom, region] of VUES) {
    const a = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, points[42].id);
    const b = regrouperLieuxCarte(melanges, region, TAILLE_TELEPHONE, points[42].id);
    assert.deepEqual(a, b, nom);
    assert.deepEqual(a.seuls.map((s) => s.id), [...a.seuls.map((s) => s.id)].sort((x, y) => x - y));
    assert.deepEqual(a.groupes.map((g) => g.cle), [...a.groupes.map((g) => g.cle)].sort());
  }
});

test("clés stables : glisser un peu la carte, ou ajouter un lieu ailleurs, garde les mêmes bulles", () => {
  const points = creerPointsFrance(10_000, 17);
  const region = regionAutour(MARSEILLE, 12_000);
  const glissee = { ...region, latitude: region.latitude + region.latitudeDelta * 0.15, longitude: region.longitude - region.longitudeDelta * 0.15 };
  const avant = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, null);
  const apres = regrouperLieuxCarte(points, glissee, TAILLE_TELEPHONE, null);
  const parCle = new Map(apres.groupes.map((g) => [g.cle, g]));
  const auMilieu = avant.groupes.filter((g) => dansLaVue(g, { ...region, latitudeDelta: region.latitudeDelta / 2, longitudeDelta: region.longitudeDelta / 2 }));
  assert.ok(auMilieu.length > 3);
  for (const g of auMilieu) assert.deepEqual(parCle.get(g.cle)?.ids, g.ids, `bulle ${g.cle}`);
  const lille = { id: 0, latitude: 50.63, longitude: 3.06, prioritaire: false };
  const avecLille = regrouperLieuxCarte([lille, ...points], region, TAILLE_TELEPHONE, null);
  assert.deepEqual(
    avecLille.groupes.map((g) => [g.cle, g.ids]),
    avant.groupes.map((g) => [g.cle, g.ids]),
  );
  const coin = { latitude: region.latitude + region.latitudeDelta * 0.45, longitude: region.longitude - region.longitudeDelta * 0.45 };
  const nouveaux = creerPointsDenses(40, coin, 60, 41, { premierId: 500_000 });
  const avecNouveaux = regrouperLieuxCarte([...points, ...nouveaux], region, TAILLE_TELEPHONE, null);
  const loinDuCoin = (g) => Math.hypot(versEcran(region, g).x - versEcran(region, coin).x, versEcran(region, g).y - versEcran(region, coin).y) > ECART_MARQUEURS_POINTS * 4;
  const parIds = new Map(avecNouveaux.groupes.map((g) => [g.ids.join(","), g.cle]));
  const loin = avant.groupes.filter(loinDuCoin);
  assert.ok(loin.length > 3);
  for (const g of loin) assert.equal(parIds.get(g.ids.join(",")), g.cle, `bulle ${g.cle} loin des nouveaux lieux`);
});

test("une même liste dans un nouveau tableau, à chaque lettre tapée, ne refait pas le regroupement", () => {
  const points = creerPointsFrance(1622, 23);
  const copie = points.map((p) => ({ ...p }));
  assert.equal(preparerPointsCarte(copie), preparerPointsCarte(points));
  assert.equal(preparerPointsCarte([...copie].reverse()), preparerPointsCarte(points));
  const region = regionAutour(MARSEILLE, 10_000);
  const a = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, null);
  const etages = [...preparerPointsCarte(points).parNiveau.entries()];
  const b = regrouperLieuxCarte(points.map((p) => ({ ...p })), region, TAILLE_TELEPHONE, null);
  assert.ok(a.groupes.length > 0);
  assert.deepEqual(b, a);
  const apres = [...preparerPointsCarte(points).parNiveau.entries()];
  assert.equal(apres.length, etages.length);
  apres.forEach(([niveau, etage], rang) => {
    assert.equal(niveau, etages[rang][0]);
    assert.equal(etage, etages[rang][1]);
  });
  const autre = points.slice(1);
  assert.notEqual(preparerPointsCarte(autre), preparerPointsCarte(points));
  const deplace = points.map((p, rang) => (rang === 3 ? { ...p, latitude: p.latitude + 0.01 } : p));
  assert.notEqual(preparerPointsCarte(deplace), preparerPointsCarte(points));
  const enSos = points.map((p, rang) => (rang === 3 ? { ...p, prioritaire: !p.prioritaire } : p));
  assert.notEqual(preparerPointsCarte(enSos), preparerPointsCarte(points));
});

test("après une recherche tapée puis effacée, la liste entière reprend son regroupement : la plus grande liste n'est jamais oubliée", () => {
  const points = creerPointsFrance(20_000, 27);
  const entiere = preparerPointsCarte(points);
  for (let lettre = 1; lettre <= 9; lettre++) preparerPointsCarte(points.filter((_, rang) => rang % (lettre + 1) !== 0));
  assert.equal(preparerPointsCarte(points.map((p) => ({ ...p }))), entiere);
  const recente = points.filter((_, rang) => rang % 3 !== 0);
  const preparee = preparerPointsCarte(recente);
  assert.equal(preparerPointsCarte([...recente]), preparee);
});

test("une bulle ne réunit que des lieux proches à l'écran : jamais une bulle géante qui avale la ville", () => {
  const points = creerPointsDenses(3000, MARSEILLE, 6_000, 20);
  for (const metres of [40_000, 10_000, 4_000, 1_500]) {
    const region = regionAutour(MARSEILLE, metres);
    const resultat = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, null);
    const parId = new Map(points.map((p) => [p.id, p]));
    const limite = ECART_MARQUEURS_POINTS * 2 ** 0.25 * Math.max(1, ETENDUE_GROUPE_CARTE) + ECART_MARQUEURS_POINTS * 0.4 + 1;
    for (const g of resultat.groupes) {
      const centre = versEcran(region, g);
      for (const id of g.ids) {
        const p = versEcran(region, parId.get(id));
        const ecart = Math.hypot(p.x - centre.x, p.y - centre.y);
        assert.ok(ecart <= limite, `${metres} m : lieu ${id} à ${ecart.toFixed(0)} points de sa bulle de ${g.nombre}`);
      }
    }
    const plusGrosse = Math.max(...resultat.groupes.map((g) => g.nombre));
    assert.ok(plusGrosse < points.filter((p) => dansLaFenetre(p, region)).length / 2 || metres >= 40_000, `${metres} m : une bulle de ${plusGrosse}`);
  }
});

test("hors SOS, alertes et lieu choisi, deux marqueurs ne se posent pas l'un sur l'autre, même sous 120 lieux", () => {
  for (const [nom, points, metresListe] of [
    ["ville dense", creerPointsFrance(6000, 21, { partPrioritaires: 0 }), [60_000, 20_000, 10_000, 4_000]],
    ["80 lieux", creerPointsDenses(80, VIEUX_PORT, 900, 22), [4_000, 2_000, 1_200]],
  ]) {
    for (const metres of metresListe) {
      const region = regionAutour(nom === "80 lieux" ? VIEUX_PORT : MARSEILLE, metres);
      const resultat = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, null);
      assert.equal(ecartsTropPetits(resultat, region, TAILLE_TELEPHONE, new Set(), ECART_SUR), 0, `${nom}, ${metres} m`);
    }
  }
});

test("au zoom rue, sans bulle, tous les lieux vraiment à l'écran sont là", () => {
  const points = creerPointsFrance(3000, 12);
  const region = regionAutour(MARSEILLE, 250);
  const resultat = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, null);
  verifierSortie(resultat, "zoom rue");
  assert.equal(resultat.groupes.length, 0);
  const montres = new Set(resultat.seuls.map((s) => s.id));
  for (const p of points.filter((p) => dansLaVue(p, region))) assert.ok(montres.has(p.id), `lieu ${p.id} à l'écran mais absent`);
});

test("au zoom rue, les lieux posés au même endroit sont écartés, chacun touchable", () => {
  const points = [1, 2, 3, 4, 5, 6].map((id) => ({ id, ...VIEUX_PORT, prioritaire: false }));
  const region = regionAutour(VIEUX_PORT, 250);
  const resultat = regrouperLieuxCarte(points, region, TAILLE_TELEPHONE, 4);
  assert.equal(resultat.groupes.length, 0);
  assert.equal(resultat.seuls.length, 6);
  for (const a of resultat.seuls) {
    for (const b of resultat.seuls) {
      if (a.id >= b.id) continue;
      const ecart = Math.hypot(versEcran(region, a).x - versEcran(region, b).x, versEcran(region, a).y - versEcran(region, b).y);
      assert.ok(ecart >= 40, `${a.id} et ${b.id} à ${ecart.toFixed(1)} points`);
    }
    const place = versEcran(region, a);
    const vraie = versEcran(region, VIEUX_PORT);
    assert.ok(Math.hypot(place.x - vraie.x, place.y - vraie.y) <= 60, `lieu ${a.id} trop loin de sa vraie place`);
  }
});

test("des points sans position valable ne cassent rien", () => {
  const points = [
    { id: 1, latitude: Number.NaN, longitude: 5, prioritaire: false },
    { id: 2, latitude: 43.3, longitude: 5.37, prioritaire: false },
  ];
  const resultat = regrouperLieuxCarte(points, regionAutour(MARSEILLE, 10_000), { largeur: 0, hauteur: 0 }, null);
  assert.deepEqual(resultat.seuls.map((s) => s.id), [2]);
  assert.deepEqual(regrouperLieuxCarte([], FRANCE, TAILLE_TELEPHONE, 3), { seuls: [], groupes: [], marge: MARGE_VUE_CARTE });
});
