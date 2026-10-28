import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { decrireAnnulationReservation } from "~/fonctions/reservations/decrire-annulation-reservation";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { decrireJourReservation } from "~/fonctions/reservations/decrire-jour-reservation";
import { decrireStatutReservation } from "~/fonctions/reservations/decrire-statut-reservation";
import { decrireStatutReservationPro } from "~/fonctions/reservations/decrire-statut-reservation-pro";
import { ecrireCreneauIso } from "~/fonctions/reservations/ecrire-creneau-iso";
import { ecrireHeuresSecours } from "~/fonctions/reservations/ecrire-heures-secours";
import { ecrireJoursSemaine } from "~/fonctions/reservations/ecrire-jours-semaine";
import { ecrireNomService } from "~/fonctions/reservations/ecrire-nom-service";
import { ecrireQuandReservation } from "~/fonctions/reservations/ecrire-quand-reservation";
import { expliquerReservation } from "~/fonctions/reservations/expliquer-reservation";
import { listerMoisCalendrier } from "~/fonctions/reservations/lister-mois-calendrier";
import { resumerReservationsComptoir } from "~/fonctions/reservations/resumer-reservations-comptoir";

const MAINTENANT = calculerInstantParis("2026-10-15", "14:00");

const reservation = (plus = {}) => ({
  id: 1,
  lieu: { id: 18, nom: "Restaurant du Capitaine Bouiboui", emoji: "⚓", type: "resto", ville: "Lyon" },
  personnes: 2,
  creneau: ecrireCreneauIso("2026-10-16", "12:30"),
  creneauxProposes: [ecrireCreneauIso("2026-10-16", "12:30")],
  message: null,
  statut: "demandee",
  motifRefus: null,
  reponduLe: null,
  presenceLe: null,
  tardive: false,
  code: null,
  ...plus,
});

test("en anglais, les créneaux disent Today, Tomorrow et la date britannique, à l'heure de Paris en 24 h", () => {
  assert.deepEqual(decrireCreneauReservation(ecrireCreneauIso("2026-10-15", "20:00"), MAINTENANT, "en"), { court: "Today · 20:00", lu: "Today at 20:00" });
  assert.equal(decrireCreneauReservation(ecrireCreneauIso("2026-10-16", "12:30"), MAINTENANT, "en").lu, "Tomorrow at 12:30");
  assert.equal(decrireCreneauReservation(ecrireCreneauIso("2026-10-17", "19:00"), MAINTENANT, "en").lu, "Saturday 17 October at 19:00");
  assert.equal(decrireCreneauReservation(ecrireCreneauIso("2027-01-02", "09:30"), MAINTENANT, "en").lu, "Saturday 2 January 2027 at 09:30");
  assert.equal(ecrireQuandReservation(ecrireCreneauIso("2026-10-16", "12:30"), MAINTENANT, "en"), "tomorrow at 12:30");
  assert.equal(ecrireQuandReservation(ecrireCreneauIso("2026-10-17", "19:00"), MAINTENANT, "en"), "Saturday 17 October at 19:00");
  assert.equal(ecrireQuandReservation(ecrireCreneauIso("2026-10-17", "19:00"), MAINTENANT, "fr"), "samedi 17 octobre à 19h");
});

test("en anglais, les jours du calendrier et de la rangée gardent leur majuscule", () => {
  assert.deepEqual(decrireJourReservation("2026-10-15", "2026-10-15", "en"), { haut: "Today", numero: "15", mois: "Oct", long: "Today, Thursday 15 October" });
  assert.deepEqual(decrireJourReservation("2026-10-17", "2026-10-15", "en"), { haut: "Sat", numero: "17", mois: "Oct", long: "Saturday 17 October" });
  assert.deepEqual(decrireJourReservation("2026-10-17", "2026-10-15", "fr"), { haut: "sam.", numero: "17", mois: "oct.", long: "Samedi 17 octobre" });
  assert.deepEqual(listerMoisCalendrier("2026-10-21", 92, "en").map((mois) => mois.titre), ["October 2026", "November 2026", "December 2026", "January 2027"]);
  assert.deepEqual(listerMoisCalendrier("2026-10-21", 92, "fr").map((mois) => mois.titre), ["Octobre 2026", "Novembre 2026", "Décembre 2026", "Janvier 2027"]);
});

test("en anglais, les jours d'un service, les services et les horaires de secours", () => {
  assert.equal(ecrireJoursSemaine([0, 1, 2, 3, 4, 5, 6], "en"), "Every day");
  assert.equal(ecrireJoursSemaine([0, 2, 3, 4, 5, 6], "en"), "Every day except Monday");
  assert.equal(ecrireJoursSemaine([2, 3, 4, 5, 6], "en"), "Tuesday to Saturday");
  assert.equal(ecrireJoursSemaine([1, 3], "en"), "Mondays and Wednesdays");
  assert.equal(ecrireJoursSemaine([1, 3, 5], "en"), "Mondays, Wednesdays and Fridays");
  assert.equal(ecrireJoursSemaine([4], "en"), "Thursdays");
  assert.equal(ecrireJoursSemaine([], "en"), "No days");
  assert.equal(ecrireNomService({ moment: "soir", rang: 1 }, "en").titre, "Evening, 1st sitting");
  assert.equal(ecrireNomService({ moment: "soir", rang: 2 }, "en").titre, "Evening, 2nd sitting");
  assert.equal(ecrireNomService({ moment: "midi", rang: null }, "en").titre, "Lunchtime");
  assert.equal(ecrireHeuresSecours(["20:30", "21:00"], "en"), "20:30, then 21:00");
});

test("en anglais, les statuts, les explications et l'annulation", () => {
  assert.equal(decrireStatutReservation(reservation(), MAINTENANT, "en").texte, "⏳ Waiting for the place");
  assert.equal(decrireStatutReservation(reservation(), MAINTENANT, "fr").texte, "⏳ En attente du lieu");
  assert.equal(decrireStatutReservationPro({ statut: "absent", presence: false }, "en").texte, "🪑 No-show");
  assert.equal(decrireStatutReservationPro({ statut: "honoree", presence: false }, "en").texte, "🎉 Arrived");
  assert.equal(
    expliquerReservation(reservation({ statut: "refusee", motifRefus: "complet" }), false, MAINTENANT, "fr"),
    "Le lieu a répondu : « C'est complet ». Pas de panique, il reste plein d'autres créneaux (et plein d'autres pépites).",
  );
  assert.match(expliquerReservation(reservation({ statut: "refusee", motifRefus: "complet" }), false, MAINTENANT, "en"), /^The place replied: “.+”\. Don't panic/);
  const annulation = decrireAnnulationReservation(reservation({ statut: "acceptee", reponduLe: MAINTENANT }), true, MAINTENANT, "en");
  assert.equal(annulation.titre, "Cancel your booking?");
  assert.equal(annulation.libelleRester, "Keep my table");
  assert.match(annulation.detail, /^Restaurant du Capitaine Bouiboui, tomorrow at 12:30, 2 people\. It's less than 2 hours away/);
  const francais = decrireAnnulationReservation(reservation({ statut: "acceptee", reponduLe: MAINTENANT }), false, MAINTENANT, "fr");
  assert.equal(francais.detail, "Restaurant du Capitaine Bouiboui, demain à 12h30, 2 personnes. En annulant maintenant, ta table repart pour un autre Miami.");
  assert.equal(resumerReservationsComptoir(2, [reservation()], "en"), "2 requests to answer · 1 table expected today");
});
