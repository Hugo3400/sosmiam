import assert from "node:assert/strict";
import { test } from "node:test";

import { decrireOuverture } from "../src/fonctions/lieux/decrire-ouverture.ts";

const MIDI_ET_SOIR = [
  { jours: [2, 3, 4, 5, 6], de: "12:00", a: "14:00" },
  { jours: [2, 3, 4, 5, 6], de: "19:00", a: "23:00" },
];

test("decrireOuverture : sans horaires rangés, rien à dire", () => {
  assert.equal(decrireOuverture([], new Date("2026-10-23T10:00:00Z")), null);
  assert.equal(decrireOuverture(undefined, new Date("2026-10-23T10:00:00Z")), null);
  assert.equal(decrireOuverture(MIDI_ET_SOIR, new Date("pas une date")), null);
  assert.equal(decrireOuverture([{ jours: [1], de: "7h", a: "midi" }], new Date("2026-10-23T10:00:00Z")), null);
});

test("decrireOuverture : ouvert, avec l'heure de fermeture à Paris (heure d'été puis d'hiver)", () => {
  assert.deepEqual(decrireOuverture(MIDI_ET_SOIR, new Date("2026-10-23T10:30:00Z")), { ouvert: true, heure: "14:00" });
  assert.deepEqual(decrireOuverture(MIDI_ET_SOIR, new Date("2026-11-20T19:00:00Z")), { ouvert: true, heure: "23:00" });
});

test("decrireOuverture : fermé, ouvre plus tard aujourd'hui, demain ou un autre jour", () => {
  assert.deepEqual(decrireOuverture(MIDI_ET_SOIR, new Date("2026-10-23T14:00:00Z")), { ouvert: false, heure: "19:00", quand: "aujourdhui", jourSemaine: 5 });
  assert.deepEqual(decrireOuverture(MIDI_ET_SOIR, new Date("2026-10-23T21:30:00Z")), { ouvert: false, heure: "12:00", quand: "demain", jourSemaine: 6 });
  assert.deepEqual(decrireOuverture(MIDI_ET_SOIR, new Date("2026-10-24T22:30:00Z")), { ouvert: false, heure: "12:00", quand: "plus-tard", jourSemaine: 2 });
});

test("decrireOuverture : un créneau qui passe minuit compte encore le lendemain matin, et deux créneaux collés n'en font qu'un", () => {
  const nuit = [{ jours: [5, 6], de: "18:00", a: "02:00" }];
  assert.deepEqual(decrireOuverture(nuit, new Date("2026-10-23T23:30:00Z")), { ouvert: true, heure: "02:00" });
  assert.deepEqual(decrireOuverture([{ jours: [5], de: "18:00", a: "24:00" }], new Date("2026-10-23T20:00:00Z")), { ouvert: true, heure: "00:00" });
  const colles = [{ jours: [5], de: "12:00", a: "15:00" }, { jours: [5], de: "15:00", a: "22:00" }];
  assert.deepEqual(decrireOuverture(colles, new Date("2026-10-23T11:00:00Z")), { ouvert: true, heure: "22:00" });
});

test("decrireOuverture : ouvert jour et nuit, pas d'heure de fermeture", () => {
  const toujours = [{ jours: [0, 1, 2, 3, 4, 5, 6], de: "00:00", a: "24:00" }];
  assert.deepEqual(decrireOuverture(toujours, new Date("2026-10-23T11:00:00Z")), { ouvert: true, heure: null });
  const jusquAMinuit = [{ jours: [5, 6], de: "00:00", a: "24:00" }];
  assert.deepEqual(decrireOuverture(jusquAMinuit, new Date("2026-10-24T11:00:00Z")), { ouvert: true, heure: "00:00" });
});

test("decrireOuverture : le jour du passage à l'heure d'hiver (25 heures) ne décale pas les jours", () => {
  const dimanche = [{ jours: [0], de: "10:00", a: "18:00" }, { jours: [1], de: "09:00", a: "12:00" }];
  assert.deepEqual(decrireOuverture(dimanche, new Date("2026-10-24T22:30:00Z")), { ouvert: false, heure: "10:00", quand: "aujourdhui", jourSemaine: 0 });
  assert.deepEqual(decrireOuverture(dimanche, new Date("2026-10-25T09:30:00Z")), { ouvert: true, heure: "18:00" });
  assert.deepEqual(decrireOuverture(dimanche, new Date("2026-10-25T18:30:00Z")), { ouvert: false, heure: "09:00", quand: "demain", jourSemaine: 1 });
});
