import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { DELAI_MIN_RESERVATION_MS, EXPIRATION_AVANT_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import { calculerJoursReservation } from "~/fonctions/reservations/calculer-jours-reservation";
import { garderCreneauxATemps } from "~/fonctions/reservations/garder-creneaux-a-temps";

const MINUTE = 60_000;
const TOUS_LES_JOURS = [0, 1, 2, 3, 4, 5, 6];
const OUVERTURE = [{ jours: TOUS_LES_JOURS, de: "12:00", a: "14:30" }, { jours: TOUS_LES_JOURS, de: "19:00", a: "23:00" }];

test("règle partagée : le lieu a toujours au moins 30 min pour répondre avant l'expiration", () => {
  assert.ok(
    DELAI_MIN_RESERVATION_MS - EXPIRATION_AVANT_CRENEAU_MS >= 30 * MINUTE,
    `DELAI_MIN_RESERVATION_MS (${DELAI_MIN_RESERVATION_MS / MINUTE} min) − EXPIRATION_AVANT_CRENEAU_MS (${EXPIRATION_AVANT_CRENEAU_MS / MINUTE} min) < 30 min`,
  );
});

test("le premier créneau proposé tombe au moins DELAI_MIN_RESERVATION_MS après maintenant (lu dans commun)", () => {
  for (const heure of ["17:29", "17:31", "18:00", "18:59", "19:00", "21:40"]) {
    const maintenantMs = calculerInstantParis("2026-10-15", heure);
    const [aujourdhui] = calculerJoursReservation(OUVERTURE, new Date(maintenantMs));
    for (const creneau of aujourdhui.creneaux) {
      assert.ok(calculerInstantParis(aujourdhui.jour, creneau) - maintenantMs >= DELAI_MIN_RESERVATION_MS, `${heure} → ${creneau}`);
    }
    const premierPossible = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"].find(
      (c) => calculerInstantParis("2026-10-15", c) - maintenantMs >= DELAI_MIN_RESERVATION_MS,
    );
    assert.equal(aujourdhui.creneaux.find((c) => c >= "19:00"), premierPossible, heure);
  }
});

test("à 17 h 29, 18 h n'est proposé que si le lieu a encore le temps de répondre", () => {
  const maintenantMs = calculerInstantParis("2026-10-15", "17:29");
  const [aujourdhui] = calculerJoursReservation([{ jours: TOUS_LES_JOURS, de: "18:00", a: "22:00" }], new Date(maintenantMs));
  const propose18h = aujourdhui.creneaux.includes("18:00");
  assert.equal(propose18h, 31 * MINUTE >= DELAI_MIN_RESERVATION_MS);
  if (DELAI_MIN_RESERVATION_MS >= 60 * MINUTE) assert.equal(aujourdhui.creneaux[0], "18:30");
});

test("garderCreneauxATemps : les créneaux lus sur le serveur repassent par la règle quand l'écran reste ouvert", () => {
  const ouvertA = calculerInstantParis("2026-10-15", "18:00");
  const lus = ["19:00", "19:30", "20:00"];
  assert.deepEqual(garderCreneauxATemps("2026-10-15", lus, ouvertA - DELAI_MIN_RESERVATION_MS + 60 * MINUTE), lus);
  const plusTard = calculerInstantParis("2026-10-15", "19:00") - DELAI_MIN_RESERVATION_MS + 1;
  assert.deepEqual(garderCreneauxATemps("2026-10-15", lus, plusTard), ["19:30", "20:00"]);
  assert.deepEqual(garderCreneauxATemps("2026-10-15", lus, calculerInstantParis("2026-10-15", "19:00") - DELAI_MIN_RESERVATION_MS), lus);
});
