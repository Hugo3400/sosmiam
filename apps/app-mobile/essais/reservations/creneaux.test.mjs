import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerMargeExpirationReservation } from "@sos-miam/commun/fonctions/reservations/calculer-marge-expiration-reservation";
import { listerJoursReservation } from "@sos-miam/commun/fonctions/reservations/lister-jours-reservation";
import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { DELAIS_RESERVATION_MS } from "@sos-miam/commun/regles/reglages-reservations";
import { garderCreneauxATemps } from "~/fonctions/reservations/garder-creneaux-a-temps";

const MINUTE = 60_000;
const TOUS_LES_JOURS = [0, 1, 2, 3, 4, 5, 6];
const OUVERTURE = [{ jours: TOUS_LES_JOURS, de: "12:00", a: "14:30" }, { jours: TOUS_LES_JOURS, de: "19:00", a: "23:00" }];
const libres = (...heures) => heures.map((heure) => ({ heure, peuDePlaces: false }));

test("règle partagée : à la main, le lieu a toujours au moins 20 min pour répondre avant que la demande s'endorme", () => {
  for (const delai of ["30-min", "1-h", "2-h"]) {
    const marge = calculerMargeExpirationReservation({ acceptation: "manuelle", delai });
    assert.ok(DELAIS_RESERVATION_MS[delai] - marge >= 20 * MINUTE, `${delai} : ${(DELAIS_RESERVATION_MS[delai] - marge) / MINUTE} min`);
  }
});

test("repli sans l'API (démo) : les jours viennent des horaires de la fiche, le dernier créneau passé fait « trop tard »", () => {
  const jours = listerJoursReservation({ ouverture: OUVERTURE, reglages: null, maintenant: new Date(calculerInstantParis("2026-10-15", "22:10")) });
  assert.equal(jours.length, 31);
  assert.deepEqual(jours[0], { jour: "2026-10-15", etat: "trop-tard" });
  assert.deepEqual(jours[1], { jour: "2026-10-16", etat: "ouvert" });
  const ferme = listerJoursReservation({ ouverture: [{ jours: [1, 2, 3, 4, 5], de: "12:00", a: "14:00" }], reglages: null, maintenant: new Date(calculerInstantParis("2026-10-16", "09:00")) });
  assert.deepEqual(ferme.slice(0, 3).map((j) => j.etat), ["ouvert", "ferme", "ferme"]);
});

test("garderCreneauxATemps : les horaires lus sur le serveur repassent par le délai du lieu quand l'écran reste ouvert", () => {
  const lus = libres("19:00", "19:30", "20:00");
  const a = (heure) => calculerInstantParis("2026-10-15", heure);
  assert.deepEqual(garderCreneauxATemps("2026-10-15", lus, "1-h", a("18:00")), lus);
  assert.deepEqual(garderCreneauxATemps("2026-10-15", lus, "1-h", a("18:01")).map((c) => c.heure), ["19:30", "20:00"]);
  assert.deepEqual(garderCreneauxATemps("2026-10-15", lus, "30-min", a("18:31")).map((c) => c.heure), ["19:30", "20:00"]);
  assert.deepEqual(garderCreneauxATemps("2026-10-15", lus, "2-h", a("17:30")).map((c) => c.heure), ["19:30", "20:00"]);
  assert.deepEqual(garderCreneauxATemps("2026-10-15", lus, "veille", a("09:00")), []);
  assert.deepEqual(garderCreneauxATemps("2026-10-16", lus, "veille", a("23:59")), lus);
});
