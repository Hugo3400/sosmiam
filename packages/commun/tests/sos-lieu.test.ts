import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerFermetureDuJour } from "../src/fonctions/lieux/calculer-fermeture-du-jour.ts";
import type { CreneauOuverture } from "../src/types/lieu.ts";

// Le vendredi 9 octobre 2026 (heure d'été : Paris = UTC + 2)
const a = (iso: string) => new Date(iso);
const TOUS = [0, 1, 2, 3, 4, 5, 6];

test("fermeture du jour : créneau en cours, prochain créneau du jour, ou rien", () => {
  const resto: CreneauOuverture[] = [{ jours: TOUS, de: "12:00", a: "14:30" }, { jours: TOUS, de: "19:00", a: "22:30" }];
  // 13 h à Paris : ouvert, ferme à 14 h 30
  assert.equal(calculerFermetureDuJour(resto, a("2026-10-09T11:00:00Z"))?.toISOString(), "2026-10-09T12:30:00.000Z");
  // 17 h à Paris : fermé, le service du soir finit à 22 h 30
  assert.equal(calculerFermetureDuJour(resto, a("2026-10-09T15:00:00Z"))?.toISOString(), "2026-10-09T20:30:00.000Z");
  // 23 h à Paris : plus rien aujourd'hui
  assert.equal(calculerFermetureDuJour(resto, a("2026-10-09T21:00:00Z")), null);
  assert.equal(calculerFermetureDuJour([], a("2026-10-09T15:00:00Z")), null);
});

test("fermeture du jour : un bar qui passe minuit, le soir même et après minuit", () => {
  // Vendredi (5) et samedi (6), de 18 h à 2 h
  const bar: CreneauOuverture[] = [{ jours: [5, 6], de: "18:00", a: "02:00" }];
  // Vendredi 21 h à Paris : ferme samedi à 2 h
  assert.equal(calculerFermetureDuJour(bar, a("2026-10-09T19:00:00Z"))?.toISOString(), "2026-10-10T00:00:00.000Z");
  // Samedi 0 h 30 à Paris : toujours le créneau de vendredi soir
  assert.equal(calculerFermetureDuJour(bar, a("2026-10-09T22:30:00Z"))?.toISOString(), "2026-10-10T00:00:00.000Z");
  // Dimanche 0 h 30 : le créneau de samedi soir (fermé le dimanche, mais celui de la veille court encore)
  assert.equal(calculerFermetureDuJour(bar, a("2026-10-10T22:30:00Z"))?.toISOString(), "2026-10-11T00:00:00.000Z");
  // Lundi 15 h : fermé toute la journée
  assert.equal(calculerFermetureDuJour(bar, a("2026-10-12T13:00:00Z")), null);
  // Minuit pile écrit « 24:00 »
  assert.equal(calculerFermetureDuJour([{ jours: TOUS, de: "19:00", a: "24:00" }], a("2026-10-09T18:00:00Z"))?.toISOString(), "2026-10-09T22:00:00.000Z");
});
