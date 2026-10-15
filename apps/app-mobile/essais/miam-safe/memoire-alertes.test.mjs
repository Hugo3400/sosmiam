import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";

import {
  ecrireCleAlerteMiamSafe, garderAlerteMiamSafe, lireAlerteGardeeMiamSafe, noterStatutAlerteMiamSafe, suivreAlerteGardeeMiamSafe,
} from "~/services/memoire-alertes-miam-safe";

const MINUTE = 60_000;
let lieu = 0;
let cle = "";

beforeEach(() => {
  mock.timers.enable({ apis: ["setTimeout", "Date"], now: Date.parse("2026-10-15T20:00:00.000Z") });
  lieu += 1;
  cle = ecrireCleAlerteMiamSafe("api", "lea@example.com", lieu);
});

afterEach(() => mock.timers.reset());

const garder = (id, telephones = 2) => garderAlerteMiamSafe(cle, { id, envoyeeLe: Date.now(), telephones });

test("une première alerte : envoyée, sans alerte précédente", () => {
  garder(1);
  assert.deepEqual(lireAlerteGardeeMiamSafe(cle), { id: 1, envoyeeLe: Date.now(), telephones: 2, statut: "envoyee", reponduLe: null, precedentes: [] });
});

test("2 minutes sans réponse : « sans-reponse » ; 15 minutes : oubliée", () => {
  garder(1);
  mock.timers.tick(2 * MINUTE - 1);
  assert.equal(lireAlerteGardeeMiamSafe(cle).statut, "envoyee");
  mock.timers.tick(1);
  assert.equal(lireAlerteGardeeMiamSafe(cle).statut, "sans-reponse");
  mock.timers.tick(13 * MINUTE - 1);
  assert.ok(lireAlerteGardeeMiamSafe(cle));
  mock.timers.tick(1);
  assert.equal(lireAlerteGardeeMiamSafe(cle), null);
});

test("« Renvoyer une alerte » après « sans réponse » : la première reste suivie avec la nouvelle", () => {
  garder(1);
  mock.timers.tick(3 * MINUTE);
  garder(2, 0);
  const alerte = lireAlerteGardeeMiamSafe(cle);
  assert.equal(alerte.id, 2);
  assert.equal(alerte.statut, "envoyee");
  assert.equal(alerte.telephones, 0);
  assert.deepEqual(alerte.precedentes, [1]);
  mock.timers.tick(MINUTE);
  garder(3);
  assert.deepEqual(lireAlerteGardeeMiamSafe(cle).precedentes, [1, 2]);
});

test("« On arrive » sur une alerte précédente : la personne voit « L'équipe arrive »", () => {
  garder(1);
  mock.timers.tick(3 * MINUTE);
  garder(2);
  const repondu = Date.now() - 30_000;
  noterStatutAlerteMiamSafe(cle, 1, "en-route", repondu);
  assert.equal(lireAlerteGardeeMiamSafe(cle).statut, "en-route");
  assert.equal(lireAlerteGardeeMiamSafe(cle).reponduLe, repondu);
});

test("« sans réponse » d'une alerte précédente ne touche pas la nouvelle ; celui de la nouvelle, si", () => {
  garder(1);
  mock.timers.tick(3 * MINUTE);
  garder(2);
  noterStatutAlerteMiamSafe(cle, 1, "sans-reponse", null);
  assert.equal(lireAlerteGardeeMiamSafe(cle).statut, "envoyee");
  noterStatutAlerteMiamSafe(cle, 2, "sans-reponse", null);
  assert.equal(lireAlerteGardeeMiamSafe(cle).statut, "sans-reponse");
});

test("« Nouvelle alerte » après « L'équipe arrive » : l'ancienne réponse ne compte plus pour la nouvelle", () => {
  garder(1);
  noterStatutAlerteMiamSafe(cle, 1, "en-route", Date.now());
  mock.timers.tick(MINUTE);
  garder(2);
  assert.deepEqual(lireAlerteGardeeMiamSafe(cle).precedentes, []);
  noterStatutAlerteMiamSafe(cle, 1, "en-route", Date.now());
  assert.equal(lireAlerteGardeeMiamSafe(cle).statut, "envoyee");
});

test("« en-route » ne revient jamais en arrière, et une alerte inconnue ne change rien", () => {
  garder(1);
  noterStatutAlerteMiamSafe(cle, 9, "en-route", Date.now());
  assert.equal(lireAlerteGardeeMiamSafe(cle).statut, "envoyee");
  noterStatutAlerteMiamSafe(cle, 1, "en-route", Date.now());
  noterStatutAlerteMiamSafe(cle, 1, "sans-reponse", null);
  noterStatutAlerteMiamSafe(cle, 1, "envoyee", null);
  assert.equal(lireAlerteGardeeMiamSafe(cle).statut, "en-route");
  mock.timers.tick(5 * MINUTE);
  assert.equal(lireAlerteGardeeMiamSafe(cle).statut, "en-route");
});

test("le renvoi repart pour 2 minutes et 15 minutes à partir de la nouvelle alerte", () => {
  garder(1);
  mock.timers.tick(10 * MINUTE);
  garder(2);
  mock.timers.tick(6 * MINUTE);
  assert.equal(lireAlerteGardeeMiamSafe(cle).id, 2);
  assert.equal(lireAlerteGardeeMiamSafe(cle).statut, "sans-reponse");
  mock.timers.tick(9 * MINUTE);
  assert.equal(lireAlerteGardeeMiamSafe(cle), null);
});

test("chaque compte a sa clé : l'alerte d'un compte n'apparaît pas pour un autre", () => {
  garder(1);
  assert.equal(lireAlerteGardeeMiamSafe(ecrireCleAlerteMiamSafe("api", "tom@example.com", lieu)), null);
  assert.equal(lireAlerteGardeeMiamSafe(ecrireCleAlerteMiamSafe("demo", "lea@example.com", lieu)), null);
});

test("les abonnés sont prévenus à chaque changement, et rattrapés à l'abonnement", () => {
  garder(1);
  let appels = 0;
  const arreter = suivreAlerteGardeeMiamSafe(cle, () => (appels += 1));
  noterStatutAlerteMiamSafe(cle, 1, "sans-reponse", null);
  noterStatutAlerteMiamSafe(cle, 1, "en-route", Date.now());
  assert.equal(appels, 2);
  arreter();
  mock.timers.tick(15 * MINUTE);
  assert.equal(appels, 2);
});
