import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEMI_CADRE_LIEU_POINTS,
  DEPLACEMENT_MAX_BULLE_POINTS,
  DIAMETRE_GROSSE_BULLE_POINTS,
  ECART_MARQUEURS_POINTS,
  ETENDUE_GROUPE_CARTE,
  NOMBRE_GROSSE_BULLE,
  PLAFOND_PRIORITAIRES_CARTE,
  PORTEE_LIEUX_BULLE_POINTS,
} from "~/contenus/regroupement-carte";
import { ecarterMarqueursCarte } from "~/fonctions/geo/ecarter-marqueurs-carte";
import { regrouperLieuxCarte } from "~/fonctions/geo/regrouper-lieux-carte";
import { relacherMarqueursCarte } from "~/fonctions/geo/relacher-marqueurs-carte";

import { MARSEILLE, TAILLE_IPAD, TAILLE_TELEPHONE, barycentreEcran, creerHasard, creerPointsDenses, dansLaFenetre, regionAutour, verifierSortie, versEcran } from "./donnees.mjs";

const DEPLACEMENT_RELACHE = ECART_MARQUEURS_POINTS * 0.4;

function partCachee(ici, rayon, fixes) {
  let total = 0;
  let cachees = 0;
  for (let dx = -rayon; dx <= rayon; dx += 1) {
    for (let dy = -rayon; dy <= rayon; dy += 1) {
      if (dx * dx + dy * dy > rayon * rayon) continue;
      total += 1;
      if (fixes.some((f) => Math.abs(f.x - ici.x - dx) < DEMI_CADRE_LIEU_POINTS && Math.abs(f.y - ici.y - dy) < DEMI_CADRE_LIEU_POINTS)) cachees += 1;
    }
  }
  return cachees / total;
}

function enSos(points, part, graine) {
  const tirer = creerHasard(graine);
  return points.map((p) => (tirer() < part ? { ...p, prioritaire: true } : p));
}

function verifierBulles(points, region, taille, selection, nom) {
  const resultat = regrouperLieuxCarte(points, region, taille, selection);
  verifierSortie(resultat, nom);
  const parId = new Map(points.map((p) => [p.id, p]));
  const fixes = resultat.seuls.filter((s) => parId.get(s.id).prioritaire || s.id === selection).map((s) => versEcran(region, s, taille));
  let posees = 0;
  let devant = 0;
  for (const g of resultat.groupes) {
    const ici = versEcran(region, g, taille);
    const { x, y, membres } = barycentreEcran(g, parId, region, taille);
    const deplacement = Math.hypot(ici.x - x, ici.y - y);
    const plusProche = (px, py) => Math.min(...membres.map((m) => Math.hypot(m.x - px, m.y - py)));
    assert.ok(deplacement <= DEPLACEMENT_MAX_BULLE_POINTS + 0.5, `${nom} : bulle de ${g.nombre} à ${deplacement.toFixed(0)} points de ses lieux`);
    const ecartNiveau = (2 ** -Number(g.cle.split(":")[0]) * 360) / (region.longitudeDelta / taille.largeur);
    const etendue = ecartNiveau * Math.max(1, ETENDUE_GROUPE_CARTE) + DEPLACEMENT_MAX_BULLE_POINTS + 1;
    for (const m of membres) assert.ok(Math.hypot(m.x - ici.x, m.y - ici.y) <= etendue, `${nom} : un lieu à plus de ${etendue.toFixed(0)} points de sa bulle`);
    if (deplacement > DEPLACEMENT_RELACHE + 0.5) {
      posees += 1;
      const limite = Math.max(PORTEE_LIEUX_BULLE_POINTS, plusProche(x, y)) + 0.5;
      assert.ok(plusProche(ici.x, ici.y) <= limite, `${nom} : bulle de ${g.nombre} sans aucun de ses lieux sous elle (${plusProche(ici.x, ici.y).toFixed(0)} points)`);
    }
    if (g.devant) {
      devant += 1;
      continue;
    }
    const ecart = Math.min(Infinity, ...fixes.map((f) => Math.max(Math.abs(f.x - ici.x), Math.abs(f.y - ici.y))));
    assert.ok(ecart >= DEMI_CADRE_LIEU_POINTS, `${nom} : bulle de ${g.nombre} sous un marqueur fixe (${ecart.toFixed(0)} points)`);
    const rayon = g.nombre >= NOMBRE_GROSSE_BULLE ? DIAMETRE_GROSSE_BULLE_POINTS / 2 : 20;
    assert.ok(partCachee(ici, rayon, fixes) <= 0.5, `${nom} : bulle de ${g.nombre} touchable sur moins de la moitié de son rond`);
  }
  return { resultat, posees, devant };
}

test("un SOS, une alerte ou le lieu choisi ne cache jamais une bulle : elle s'écarte sur ses lieux (44 points au plus), sinon elle passe devant", () => {
  const ville = creerPointsDenses(2500, MARSEILLE, 5_000, 24);
  let posees = 0;
  let devant = 0;
  for (const taille of [TAILLE_TELEPHONE, TAILLE_IPAD]) {
    const region = regionAutour(MARSEILLE, 10_000, taille);
    const sans = regrouperLieuxCarte(ville, region, taille, null);
    const grosses = [...sans.groupes].sort((a, b) => b.nombre - a.nombre).slice(0, 3);
    const sosAuCentre = [...ville, ...grosses.map((g, rang) => ({ id: 900_000 + rang, latitude: g.latitude, longitude: g.longitude, prioritaire: true }))];
    const cas = [
      ["3 SOS au centre des plus grosses bulles", sosAuCentre, null],
      ["3 SOS et le lieu choisi au cœur de la plus grosse", sosAuCentre, grosses[0].ids[Math.floor(grosses[0].ids.length / 2)]],
      ["3 % en SOS", enSos(ville, 0.03, 3), null],
      ["10 % en SOS et un lieu choisi", enSos(ville, 0.1, 10), ville[10].id],
    ];
    for (const [nom, points, selection] of cas) {
      const bilan = verifierBulles(points, region, taille, selection, `${nom} (${taille.largeur} pt)`);
      posees += bilan.posees;
      devant += bilan.devant;
    }
  }
  assert.ok(posees > 5, `${posees} bulles écartées seulement`);
  assert.ok(devant > 3, `${devant} bulles devant seulement`);
});

test("les SOS, les alertes et le lieu choisi restent à leur vraie place : seuls les autres marqueurs s'écartent", () => {
  const ville = enSos(creerPointsDenses(1500, MARSEILLE, 3_000, 28), 0.05, 29);
  const parId = new Map(ville.map((p) => [p.id, p]));
  const parAdresse = new Map();
  for (const p of ville) parAdresse.set(`${p.latitude.toFixed(5)}:${p.longitude.toFixed(5)}`, (parAdresse.get(`${p.latitude.toFixed(5)}:${p.longitude.toFixed(5)}`) ?? 0) + 1);
  let verifies = 0;
  for (const [taille, metres] of [
    [TAILLE_TELEPHONE, 10_000],
    [TAILLE_TELEPHONE, 250],
    [TAILLE_IPAD, 600],
  ]) {
    const region = regionAutour(MARSEILLE, metres, taille);
    const selection = ville[40].id;
    const resultat = regrouperLieuxCarte(ville, region, taille, selection);
    verifierSortie(resultat, `${metres} m`);
    for (const seul of resultat.seuls) {
      const vrai = parId.get(seul.id);
      if (!(vrai.prioritaire || seul.id === selection) || parAdresse.get(`${vrai.latitude.toFixed(5)}:${vrai.longitude.toFixed(5)}`) > 1) continue;
      verifies += 1;
      assert.deepEqual([seul.latitude, seul.longitude], [vrai.latitude, vrai.longitude], `${metres} m : le lieu ${seul.id} a bougé`);
    }
  }
  assert.ok(verifies > 20);
});

test("plus de 60 SOS dans la vue : ceux d'au-delà, dessinés seuls, écartent aussi les bulles", () => {
  const ville = creerPointsDenses(2000, MARSEILLE, 4_000, 25);
  const tirer = creerHasard(26);
  const points = ville.map((p) => (tirer() < 0.06 ? { ...p, prioritaire: true } : p));
  const region = regionAutour(MARSEILLE, 6_000);
  assert.ok(points.filter((p) => p.prioritaire && dansLaFenetre(p, region)).length > PLAFOND_PRIORITAIRES_CARTE + 20);
  const { resultat } = verifierBulles(points, region, TAILLE_TELEPHONE, null, "plus de 60 SOS");
  const parId = new Map(points.map((p) => [p.id, p]));
  assert.ok(resultat.seuls.filter((s) => parId.get(s.id).prioritaire).length > PLAFOND_PRIORITAIRES_CARTE, "des SOS d'au-delà du plafond dessinés seuls");
});

test("deux bulles de 100 lieux et plus, plus larges, se tiennent assez loin l'une de l'autre pour ne pas se recouvrir", () => {
  const ville = creerPointsDenses(3000, MARSEILLE, 6_000, 20);
  let paires = 0;
  for (const [taille, metres] of [
    [TAILLE_TELEPHONE, 60_000],
    [TAILLE_TELEPHONE, 20_000],
    [TAILLE_IPAD, 60_000],
  ]) {
    const region = regionAutour(MARSEILLE, metres, taille);
    const grosses = regrouperLieuxCarte(ville, region, taille, null).groupes.filter((g) => g.nombre >= NOMBRE_GROSSE_BULLE).map((g) => versEcran(region, g, taille));
    for (let a = 0; a < grosses.length; a++) {
      for (let b = a + 1; b < grosses.length; b++) {
        paires += 1;
        const ecart = Math.hypot(grosses[a].x - grosses[b].x, grosses[a].y - grosses[b].y);
        assert.ok(ecart >= DIAMETRE_GROSSE_BULLE_POINTS - 3, `${metres} m : deux grosses bulles à ${ecart.toFixed(1)} points`);
      }
    }
  }
  assert.ok(paires > 0);
});

test("écarter les marqueurs : chacun bouge au plus de son écart permis, les fixes jamais, et un refus est respecté", () => {
  const meme = relacherMarqueursCarte([
    { x: 100, y: 100, diametre: 40, deplacementMax: 20 },
    { x: 100, y: 100, diametre: 40, deplacementMax: 20 },
  ]);
  assert.ok(Math.hypot(meme[0].x - meme[1].x, meme[0].y - meme[1].y) >= 37.9);
  for (const place of meme) assert.ok(Math.hypot(place.x - 100, place.y - 100) <= 20 + 1e-9);
  const contreFixe = relacherMarqueursCarte([
    { x: 0, y: 0, diametre: 40, deplacementMax: 0 },
    { x: 10, y: 0, diametre: 40, deplacementMax: 15 },
    { x: 500, y: 500, diametre: 40, deplacementMax: 15 },
  ]);
  assert.deepEqual(contreFixe[0], { x: 0, y: 0 });
  assert.ok(Math.abs(contreFixe[1].x - 25) < 1e-9 && Math.abs(contreFixe[1].y) < 1e-9, JSON.stringify(contreFixe[1]));
  assert.deepEqual(contreFixe[2], { x: 500, y: 500 });
  const grosses = relacherMarqueursCarte([
    { x: 0, y: 0, diametre: 44, deplacementMax: 15 },
    { x: 30, y: 0, diametre: 44, deplacementMax: 15 },
  ]);
  assert.ok(Math.abs(grosses[1].x - grosses[0].x - 42) < 1e-9, "deux bulles de 44 points : 42 points entre leurs centres");
  const refuse = relacherMarqueursCarte(
    [
      { x: 0, y: 0, diametre: 40, deplacementMax: 15 },
      { x: 5, y: 0, diametre: 40, deplacementMax: 15 },
    ],
    () => false,
  );
  assert.deepEqual(refuse, [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
  ]);
});

test("en s'écartant l'une de l'autre, deux bulles ne se glissent jamais sous un SOS, et un lieu collé à un SOS s'en écarte d'un rayon", () => {
  const echelle = { degresParPoint: 1e-5, cosLatitude: 1, latitude: 0, longitude: 0 };
  const aLEcran = (x, y) => ({ latitude: -y * 1e-5, longitude: x * 1e-5 });
  const enPoints = (p) => ({ x: p.longitude / 1e-5, y: -p.latitude / 1e-5 });
  const sos = { id: 1, ...aLEcran(0, 0) };
  const bulle = (cle, x) => ({ cle, nombre: 3, ids: [10, 11, 12], ...aLEcran(x, 0) });
  const { groupes } = ecarterMarqueursCarte([bulle("a", 41), bulle("b", 66)], [sos], [], echelle, () => []);
  const [a, b] = groupes.map(enPoints);
  assert.ok(Math.abs(a.x) >= 39.5, `la bulle collée au SOS s'en rapproche (${a.x.toFixed(1)} points)`);
  assert.ok(b.x - a.x >= 38 - 0.5, `les deux bulles restent l'une sur l'autre (${(b.x - a.x).toFixed(1)} points)`);
  const { seuls } = ecarterMarqueursCarte([], [sos], [{ id: 2, ...aLEcran(5, 0) }], echelle, () => []);
  assert.ok(Math.abs(enPoints(seuls[0]).x - 25) < 1e-6, `le lieu voisin du SOS à ${enPoints(seuls[0]).x.toFixed(1)} points`);
});
