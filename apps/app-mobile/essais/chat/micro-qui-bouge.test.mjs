import assert from "node:assert/strict";
import { test } from "node:test";

import { FORME_ONDE_VOCAL } from "@sos-miam/commun/regles/chat";
import { calculerOndeVocal } from "~/fonctions/chat/calculer-onde-vocal";
import { convertirNiveauMicro } from "~/fonctions/chat/convertir-niveau-micro";
import { lireOndeVocal } from "~/fonctions/chat/lire-onde-vocal";
import { suivreSilenceMicro } from "~/fonctions/chat/suivre-silence-micro";

test("niveau du micro : décibels ramenés entre 0 et 1, rien si pas mesuré", () => {
  assert.equal(convertirNiveauMicro(0), 1);
  assert.equal(convertirNiveauMicro(-30), 0.5);
  assert.equal(convertirNiveauMicro(-60), 0);
  assert.equal(convertirNiveauMicro(-160), 0);
  assert.equal(convertirNiveauMicro(4), 1);
  assert.equal(convertirNiveauMicro(undefined), null);
  assert.equal(convertirNiveauMicro(Number.NaN), null);
});

test("silence : prévenu après 3 secondes presque sans rien, plus dès que la voix revient", () => {
  let etat = { dernierSonMs: 0, silencieux: false };
  for (const t of [200, 1000, 2000, 2900]) etat = suivreSilenceMicro(etat.dernierSonMs, 0.05, t);
  assert.equal(etat.silencieux, false);
  etat = suivreSilenceMicro(etat.dernierSonMs, 0.1, 3000);
  assert.equal(etat.silencieux, true);
  etat = suivreSilenceMicro(etat.dernierSonMs, 0.6, 3200);
  assert.deepEqual(etat, { dernierSonMs: 3200, silencieux: false });
  etat = suivreSilenceMicro(etat.dernierSonMs, 0.05, 6100);
  assert.equal(etat.silencieux, false);
  assert.equal(suivreSilenceMicro(etat.dernierSonMs, 0.05, 6200).silencieux, true);
});

test("silence : sans mesure du micro, on ne prévient jamais", () => {
  assert.deepEqual(suivreSilenceMicro(0, null, 9000), { dernierSonMs: 9000, silencieux: false });
});

test("onde : 48 chiffres de 0 à 9, acceptés par le serveur", () => {
  const niveaux = Array.from({ length: 300 }, (_, i) => Math.abs(Math.sin(i / 10)));
  const onde = calculerOndeVocal(niveaux);
  assert.equal(onde.length, 48);
  assert.match(onde, FORME_ONDE_VOCAL);
  assert.ok(onde.includes("9"));
});

test("onde : une note courte est étirée, chaque mesure garde sa place", () => {
  const onde = calculerOndeVocal([0, 1, 0, 1]);
  assert.equal(onde.length, 48);
  assert.equal(onde.slice(0, 12), "000000000000");
  assert.equal(onde.slice(12, 24), "999999999999");
});

test("onde : le pic de chaque tranche, ramené au plus fort de la note ; une note toute bas reste basse", () => {
  assert.equal(calculerOndeVocal(Array(96).fill(0.5)), "9".repeat(48));
  assert.equal(calculerOndeVocal(Array(48).fill(0.05)), "1".repeat(48));
  assert.equal(calculerOndeVocal([2, -1, Number.NaN]).length, 48);
  assert.equal(calculerOndeVocal([]), null);
  assert.equal(calculerOndeVocal([Number.NaN]), null);
});

test("onde lue : chiffres en niveaux, rien pour une onde absente ou abîmée", () => {
  assert.deepEqual(lireOndeVocal("0123456789012345"), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5]);
  assert.equal(lireOndeVocal(undefined), null);
  assert.equal(lireOndeVocal("12ab"), null);
  assert.equal(lireOndeVocal("123"), null);
  assert.equal(lireOndeVocal("1".repeat(49)), null);
});
