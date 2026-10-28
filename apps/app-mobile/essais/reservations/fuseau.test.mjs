import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { estTelephoneALHeureDeParis } from "~/fonctions/dates/est-telephone-a-l-heure-de-paris";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { ecrireCreneauIso } from "~/fonctions/reservations/ecrire-creneau-iso";

const FUSEAUX = ["Europe/Paris", "America/New_York", "Asia/Tokyo", "Pacific/Kiritimati", "America/Guadeloupe"];

function sousLeFuseau(fuseau, f) {
  const avant = process.env.TZ;
  process.env.TZ = fuseau;
  try {
    f();
  } finally {
    if (avant === undefined) delete process.env.TZ;
    else process.env.TZ = avant;
  }
}

test("le créneau choisi « 20h » se lit « 20h » quel que soit le fuseau du téléphone", () => {
  const maintenantMs = calculerInstantParis("2026-10-15", "14:00");
  const creneau = ecrireCreneauIso("2026-10-15", "20:00");
  for (const fuseau of FUSEAUX) {
    sousLeFuseau(fuseau, () => {
      assert.deepEqual(decrireCreneauReservation(creneau, maintenantMs, "fr"), { court: "Aujourd'hui · 20h", lu: "Aujourd'hui à 20h" }, fuseau);
      assert.equal(ecrireHeureParis(creneau), "20h", fuseau);
    });
  }
});

test("jours nommés à l'heure de Paris : demain, hier, et un jour plus loin", () => {
  const maintenantMs = calculerInstantParis("2026-10-15", "23:30");
  for (const fuseau of FUSEAUX) {
    sousLeFuseau(fuseau, () => {
      assert.equal(decrireCreneauReservation(ecrireCreneauIso("2026-10-16", "12:30"), maintenantMs, "fr").lu, "Demain à 12h30", fuseau);
      assert.equal(decrireCreneauReservation(ecrireCreneauIso("2026-10-14", "21:00"), maintenantMs, "fr").lu, "Hier à 21h", fuseau);
      assert.equal(decrireCreneauReservation(ecrireCreneauIso("2026-10-17", "19:00"), maintenantMs, "fr").lu, "Samedi 17 octobre à 19h", fuseau);
      assert.equal(decrireCreneauReservation(ecrireCreneauIso("2027-01-02", "19:00"), maintenantMs, "fr").lu, "Samedi 2 janvier 2027 à 19h", fuseau);
    });
  }
});

test("passage à l'heure d'hiver (25 octobre 2026) : 19h reste 19h", () => {
  const maintenantMs = calculerInstantParis("2026-10-24", "12:00");
  for (const fuseau of FUSEAUX) {
    sousLeFuseau(fuseau, () => {
      assert.equal(decrireCreneauReservation(ecrireCreneauIso("2026-10-25", "19:00"), maintenantMs, "fr").lu, "Demain à 19h", fuseau);
      assert.equal(decrireCreneauReservation(ecrireCreneauIso("2026-10-26", "09:30"), maintenantMs, "fr").lu, "Lundi 26 octobre à 9h30", fuseau);
    });
  }
});

test("créneau illisible : rien d'écrit", () => {
  assert.deepEqual(decrireCreneauReservation("pas une date", Date.now(), "fr"), { court: "", lu: "" });
  assert.equal(ecrireHeureParis("pas une date"), "");
});

test("la mention « heure de Paris » ne s'affiche que hors du fuseau de Paris", () => {
  const ete = calculerInstantParis("2026-07-01", "12:00");
  const hiver = calculerInstantParis("2026-12-01", "12:00");
  sousLeFuseau("Europe/Paris", () => {
    assert.equal(estTelephoneALHeureDeParis(ete), true);
    assert.equal(estTelephoneALHeureDeParis(hiver), true);
  });
  sousLeFuseau("Europe/Brussels", () => assert.equal(estTelephoneALHeureDeParis(ete), true));
  sousLeFuseau("Europe/London", () => assert.equal(estTelephoneALHeureDeParis(ete), false));
  sousLeFuseau("America/New_York", () => assert.equal(estTelephoneALHeureDeParis(hiver), false));
});
