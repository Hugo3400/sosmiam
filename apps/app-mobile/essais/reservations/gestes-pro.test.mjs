import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { calculerGestesReservationPro } from "~/fonctions/reservations/calculer-gestes-reservation-pro";
import { rangerReservationsPro } from "~/fonctions/reservations/ranger-reservations-pro";
import { resumerReservationsComptoir } from "~/fonctions/reservations/resumer-reservations-comptoir";

const iso = (jour, heure) => new Date(calculerInstantParis(jour, heure)).toISOString();
const resa = (id, statut, creneau, plus = {}) => ({ id, prenom: "Karim", initialeNom: "B", avatar: "🦊", personnes: 2, creneau, message: null, statut, presence: false, code: null, creeLe: creneau, ...plus });

test("accepter jusqu'à 30 min avant le créneau, refuser tant que c'est une demande", () => {
  const creneau = iso("2026-10-15", "20:00");
  const avant = calculerGestesReservationPro(resa(1, "demandee", creneau), calculerInstantParis("2026-10-15", "19:29"));
  assert.deepEqual(avant, { accepter: true, refuser: true, venu: false, absent: false, annuler: false });
  const tard = calculerGestesReservationPro(resa(1, "demandee", creneau), calculerInstantParis("2026-10-15", "19:30"));
  assert.equal(tard.accepter, false);
});

test("« Venu » de 30 min avant à 4 h après ; « Pas venu » à partir de 30 min après", () => {
  const r = resa(2, "acceptee", iso("2026-10-15", "20:00"));
  const a = (heure, jour = "2026-10-15") => calculerGestesReservationPro(r, calculerInstantParis(jour, heure));
  assert.deepEqual(a("19:29"), { accepter: false, refuser: false, venu: false, absent: false, annuler: true });
  assert.deepEqual(a("19:30"), { accepter: false, refuser: false, venu: true, absent: false, annuler: true });
  assert.deepEqual(a("20:30"), { accepter: false, refuser: false, venu: true, absent: true, annuler: false });
  assert.deepEqual(a("00:01", "2026-10-16"), { accepter: false, refuser: false, venu: false, absent: true, annuler: false });
});

test("à la main avec 30 min de délai : la demande s'accepte jusqu'à 10 min avant, comme le dit limiteReponse", () => {
  const creneau = iso("2026-10-15", "20:00");
  const r = resa(3, "demandee", creneau, { limiteReponse: iso("2026-10-15", "19:50") });
  assert.equal(calculerGestesReservationPro(r, calculerInstantParis("2026-10-15", "19:45")).accepter, true);
  assert.equal(calculerGestesReservationPro(r, calculerInstantParis("2026-10-15", "19:50")).accepter, false);
});

test("le lieu annule une table seulement avant son créneau, jamais 3 h après", () => {
  const r = resa(4, "acceptee", iso("2026-10-15", "20:00"));
  assert.equal(calculerGestesReservationPro(r, calculerInstantParis("2026-10-15", "19:59")).annuler, true);
  assert.equal(calculerGestesReservationPro(r, calculerInstantParis("2026-10-15", "23:00")).annuler, false);
});

test("rangement : à répondre, aujourd'hui (jusqu'à minuit, heure de Paris), puis les jours qui viennent", () => {
  const maintenantMs = calculerInstantParis("2026-10-15", "18:00");
  const liste = [
    resa(5, "acceptee", iso("2026-10-17", "12:30")),
    resa(1, "demandee", iso("2026-10-16", "12:30")),
    resa(2, "acceptee", iso("2026-10-15", "21:00")),
    resa(3, "honoree", iso("2026-10-15", "12:30")),
    resa(4, "acceptee", iso("2026-10-15", "23:30")),
    resa(6, "refusee", iso("2026-10-15", "20:00")),
  ];
  const { aRepondre, aujourdhui, aVenir } = rangerReservationsPro(liste, maintenantMs);
  assert.deepEqual(aRepondre.map((r) => r.id), [1]);
  assert.deepEqual(aujourdhui.map((r) => r.id), [3, 2, 4]);
  assert.deepEqual(aVenir.map((r) => r.id), [5]);
});

test("l'entrée du comptoir résume en une ligne", () => {
  const ines = resa(9, "acceptee", iso("2026-10-15", "20:00"));
  assert.equal(resumerReservationsComptoir(0, []), "Les demandes de tes clients arrivent ici");
  assert.equal(resumerReservationsComptoir(1, []), "1 demande à répondre");
  assert.equal(resumerReservationsComptoir(2, [ines]), "2 demandes à répondre · 1 table attendue aujourd'hui");
  assert.equal(resumerReservationsComptoir(0, [ines, ines]), "2 tables attendues aujourd'hui");
});
