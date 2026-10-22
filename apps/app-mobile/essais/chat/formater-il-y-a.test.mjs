process.env.TZ = "Europe/Paris";

import assert from "node:assert/strict";
import { test } from "node:test";

import { formaterIlYA } from "~/fonctions/dates/formater-il-y-a";

const le = (annee, mois, jour, heure = 0, minute = 0, seconde = 0) => new Date(annee, mois - 1, jour, heure, minute, seconde);
const ilYA = (message, maintenant) => formaterIlYA(message.toISOString(), maintenant);

const MAINTENANT = le(2026, 10, 22, 19, 20);

test("moins d'une minute, ou une date un peu en avance : « à l'instant »", () => {
  assert.deepEqual(ilYA(le(2026, 10, 22, 19, 20), MAINTENANT), { court: "à l'instant", lu: "à l'instant" });
  assert.deepEqual(ilYA(le(2026, 10, 22, 19, 19, 1), MAINTENANT), { court: "à l'instant", lu: "à l'instant" });
  assert.deepEqual(ilYA(le(2026, 10, 22, 19, 25), MAINTENANT), { court: "à l'instant", lu: "à l'instant" });
});

test("moins d'une heure : les minutes, « minute » au singulier", () => {
  assert.deepEqual(ilYA(le(2026, 10, 22, 19, 19), MAINTENANT), { court: "il y a 1 min", lu: "il y a 1 minute" });
  assert.deepEqual(ilYA(le(2026, 10, 22, 19, 8), MAINTENANT), { court: "il y a 12 min", lu: "il y a 12 minutes" });
  assert.deepEqual(ilYA(le(2026, 10, 22, 18, 20, 1), MAINTENANT), { court: "il y a 59 min", lu: "il y a 59 minutes" });
});

test("le même jour, au-delà d'une heure : les heures entamées ne comptent pas", () => {
  assert.deepEqual(ilYA(le(2026, 10, 22, 18, 20), MAINTENANT), { court: "il y a 1 h", lu: "il y a 1 heure" });
  assert.deepEqual(ilYA(le(2026, 10, 22, 17, 21), MAINTENANT), { court: "il y a 1 h", lu: "il y a 1 heure" });
  assert.deepEqual(ilYA(le(2026, 10, 22, 8, 0), MAINTENANT), { court: "il y a 11 h", lu: "il y a 11 heures" });
  assert.deepEqual(ilYA(le(2026, 10, 22, 0, 0), MAINTENANT), { court: "il y a 19 h", lu: "il y a 19 heures" });
});

test("autour de minuit : les minutes d'abord, puis « hier » dès le jour d'avant", () => {
  const minuitDix = le(2026, 10, 23, 0, 10);
  assert.equal(ilYA(le(2026, 10, 22, 23, 50), minuitDix).court, "il y a 20 min");
  assert.equal(ilYA(le(2026, 10, 22, 23, 9), minuitDix).court, "hier");
  assert.equal(ilYA(le(2026, 10, 22, 0, 0), minuitDix).court, "hier");
  assert.deepEqual(ilYA(le(2026, 10, 21, 23, 59), minuitDix), { court: "mer.", lu: "mercredi" });
  assert.equal(ilYA(le(2026, 10, 23, 0, 0), le(2026, 10, 23, 23, 59)).court, "il y a 23 h");
});

test("dans les 6 derniers jours : le jour de la semaine en court", () => {
  assert.deepEqual(ilYA(le(2026, 10, 20, 12, 0), MAINTENANT), { court: "mar.", lu: "mardi" });
  assert.deepEqual(ilYA(le(2026, 10, 16, 23, 59), MAINTENANT), { court: "ven.", lu: "vendredi" });
});

test("plus loin : le jour et le mois, « 1er », et l'année si ce n'est pas celle-ci", () => {
  assert.deepEqual(ilYA(le(2026, 10, 15, 22, 0), MAINTENANT), { court: "15 oct.", lu: "15 octobre" });
  assert.deepEqual(ilYA(le(2026, 10, 1, 9, 0), MAINTENANT), { court: "1er oct.", lu: "1er octobre" });
  assert.deepEqual(ilYA(le(2025, 10, 12, 9, 0), MAINTENANT), { court: "12 oct. 2025", lu: "12 octobre 2025" });
});

test("passage à la nouvelle année", () => {
  const nouvelAn = le(2027, 1, 1, 0, 5);
  assert.equal(ilYA(le(2026, 12, 31, 23, 58), nouvelAn).court, "il y a 7 min");
  assert.equal(ilYA(le(2026, 12, 31, 20, 0), nouvelAn).court, "hier");
  assert.deepEqual(ilYA(le(2026, 12, 30, 20, 0), le(2027, 1, 3, 10, 0)), { court: "mer.", lu: "mercredi" });
  assert.deepEqual(ilYA(le(2026, 12, 20, 20, 0), nouvelAn), { court: "20 déc. 2026", lu: "20 décembre 2026" });
});

test("changement d'heure d'hiver (25 octobre 2026) : les jours restent des jours", () => {
  assert.equal(ilYA(le(2026, 10, 25, 1, 0), le(2026, 10, 25, 12, 0)).court, "il y a 12 h");
  assert.equal(ilYA(le(2026, 10, 25, 10, 0), le(2026, 10, 26, 10, 0)).court, "hier");
  assert.equal(ilYA(le(2026, 10, 24, 23, 30), le(2026, 10, 26, 0, 30)).court, "sam.");
});

test("date illisible : rien", () => {
  assert.deepEqual(formaterIlYA("pas une date", MAINTENANT), { court: "", lu: "" });
  assert.deepEqual(formaterIlYA("", MAINTENANT), { court: "", lu: "" });
});
