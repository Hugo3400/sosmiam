import { test } from "node:test";
import assert from "node:assert/strict";
import type { CreneauOuverture } from "../src/types/lieu.ts";
import type { EtatReservationPourTransition, EvenementReservation, StatutReservation } from "../src/types/reservation.ts";
import { faireEvoluerReservation } from "../src/fonctions/reservations/faire-evoluer-reservation.ts";
import { listerCreneauxReservation } from "../src/fonctions/reservations/lister-creneaux-reservation.ts";
import { calculerDecalageParis } from "../src/fonctions/temps/calculer-decalage-paris.ts";
import { calculerInstantParis } from "../src/fonctions/temps/calculer-instant-paris.ts";

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;
/** Vendredi 9 octobre 2026, 20 h 00 à Paris (heure d'été) */
const CRENEAU = Date.parse("2026-10-09T18:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();

const EVENEMENTS: EvenementReservation[] = [
  { type: "accepter" },
  { type: "refuser", motif: "complet" },
  { type: "annuler-client" },
  { type: "annuler-lieu", motif: "ferme" },
  { type: "expirer" },
  { type: "venu" },
  { type: "absent" },
  { type: "presence" },
];

const etat = (statut: StatutReservation, presenceLe: string | null = null): EtatReservationPourTransition => ({
  statut,
  creneau: iso(CRENEAU),
  presenceLe,
});

test("« Venu » sans « Je suis là » : honorée, mais pas de visite", () => {
  const t = faireEvoluerReservation(etat("acceptee"), { type: "venu" }, CRENEAU + 10 * MINUTE);
  assert.deepEqual(t, { ok: true, statut: "honoree", presenceLe: null, tardive: false, effets: [] });
});

test("« Je suis là » puis « Venu » : la visite est créée", () => {
  const presence = faireEvoluerReservation(etat("acceptee"), { type: "presence" }, CRENEAU - 10 * MINUTE);
  assert.deepEqual(presence, { ok: true, statut: "acceptee", presenceLe: iso(CRENEAU - 10 * MINUTE), tardive: false, effets: [] });
  assert.ok(presence.ok);
  const venu = faireEvoluerReservation(etat("acceptee", presence.presenceLe), { type: "venu" }, CRENEAU + 5 * MINUTE);
  assert.deepEqual(venu, { ok: true, statut: "honoree", presenceLe: presence.presenceLe, tardive: false, effets: [{ type: "creer-visite" }] });
});

test("« Venu » puis « Je suis là » (honorée sans présence) : la visite est créée, dans la plage seulement", () => {
  const t = faireEvoluerReservation(etat("honoree"), { type: "presence" }, CRENEAU + 30 * MINUTE);
  assert.deepEqual(t, { ok: true, statut: "honoree", presenceLe: iso(CRENEAU + 30 * MINUTE), tardive: false, effets: [{ type: "creer-visite" }] });
  assert.deepEqual(faireEvoluerReservation(etat("honoree"), { type: "presence" }, CRENEAU + 4 * HEURE + 1), {
    ok: false,
    erreur: "hors-fenetre-presence",
  });
  // Une présence déjà notée ne crée pas une seconde visite
  assert.deepEqual(faireEvoluerReservation(etat("honoree", iso(CRENEAU)), { type: "presence" }, CRENEAU + HEURE), {
    ok: false,
    erreur: "transition-interdite",
  });
});

test("« Je suis là » : d'une heure avant le créneau à 4 h après, une seule fois", () => {
  assert.deepEqual(faireEvoluerReservation(etat("acceptee"), { type: "presence" }, CRENEAU - HEURE - 1), { ok: false, erreur: "hors-fenetre-presence" });
  assert.equal(faireEvoluerReservation(etat("acceptee"), { type: "presence" }, CRENEAU - HEURE).ok, true);
  assert.equal(faireEvoluerReservation(etat("acceptee"), { type: "presence" }, CRENEAU + 4 * HEURE).ok, true);
  assert.deepEqual(faireEvoluerReservation(etat("acceptee"), { type: "presence" }, CRENEAU + 4 * HEURE + 1), { ok: false, erreur: "hors-fenetre-presence" });
  assert.deepEqual(faireEvoluerReservation(etat("acceptee", iso(CRENEAU)), { type: "presence" }, CRENEAU), { ok: false, erreur: "transition-interdite" });
});

test("« absent » à créneau + 29 min : refusé ; à + 30 min : absent, avec un contrôle", () => {
  assert.deepEqual(faireEvoluerReservation(etat("acceptee"), { type: "absent" }, CRENEAU + 29 * MINUTE), { ok: false, erreur: "transition-interdite" });
  assert.deepEqual(faireEvoluerReservation(etat("acceptee"), { type: "absent" }, CRENEAU + 30 * MINUTE), {
    ok: true,
    statut: "absent",
    presenceLe: null,
    tardive: false,
    effets: [{ type: "controle", motif: "absence-reservation" }],
  });
});

test("« Venu » : de 30 min avant le créneau à 4 h après", () => {
  assert.deepEqual(faireEvoluerReservation(etat("acceptee"), { type: "venu" }, CRENEAU - 31 * MINUTE), { ok: false, erreur: "transition-interdite" });
  assert.equal(faireEvoluerReservation(etat("acceptee"), { type: "venu" }, CRENEAU - 30 * MINUTE).ok, true);
  assert.deepEqual(faireEvoluerReservation(etat("acceptee"), { type: "venu" }, CRENEAU + 4 * HEURE + 1), { ok: false, erreur: "delai-depasse" });
});

test("annulation par le client : tardive à moins de 2 h, impossible après le créneau", () => {
  assert.deepEqual(faireEvoluerReservation(etat("acceptee"), { type: "annuler-client" }, CRENEAU - 3 * HEURE), {
    ok: true, statut: "annulee", presenceLe: null, tardive: false, effets: [],
  });
  assert.deepEqual(faireEvoluerReservation(etat("acceptee"), { type: "annuler-client" }, CRENEAU - HEURE), {
    ok: true, statut: "annulee", presenceLe: null, tardive: true, effets: [{ type: "controle", motif: "annulation-tardive" }],
  });
  assert.deepEqual(faireEvoluerReservation(etat("acceptee"), { type: "annuler-client" }, CRENEAU), { ok: false, erreur: "delai-depasse" });
  // Une demande pas encore acceptée s'annule sans rien noter
  assert.deepEqual(faireEvoluerReservation(etat("demandee"), { type: "annuler-client" }, CRENEAU - HEURE), {
    ok: true, statut: "annulee", presenceLe: null, tardive: false, effets: [],
  });
});

test("demande : acceptée jusqu'au créneau − 30 min, expirée à partir de là", () => {
  assert.equal(faireEvoluerReservation(etat("demandee"), { type: "accepter" }, CRENEAU - 31 * MINUTE).ok, true);
  assert.deepEqual(faireEvoluerReservation(etat("demandee"), { type: "accepter" }, CRENEAU - 30 * MINUTE), { ok: false, erreur: "delai-depasse" });
  assert.deepEqual(faireEvoluerReservation(etat("demandee"), { type: "expirer" }, CRENEAU - 31 * MINUTE), { ok: false, erreur: "transition-interdite" });
  assert.deepEqual(faireEvoluerReservation(etat("demandee"), { type: "expirer" }, CRENEAU - 30 * MINUTE), {
    ok: true, statut: "expiree", presenceLe: null, tardive: false, effets: [],
  });
  assert.equal(faireEvoluerReservation(etat("demandee"), { type: "refuser", motif: "complet" }, CRENEAU - HEURE).ok, true);
  assert.equal(faireEvoluerReservation(etat("acceptee"), { type: "annuler-lieu", motif: "ferme" }, CRENEAU - HEURE).ok, true);
});

test("transitions interdites", () => {
  const permises: Partial<Record<StatutReservation, EvenementReservation["type"][]>> = {
    demandee: ["accepter", "refuser", "annuler-client", "expirer"],
    acceptee: ["venu", "absent", "annuler-client", "annuler-lieu", "presence"],
    honoree: ["presence"],
  };
  const statuts: StatutReservation[] = ["demandee", "acceptee", "refusee", "annulee", "expiree", "honoree", "absent"];
  for (const statut of statuts) {
    for (const e of EVENEMENTS) {
      if (permises[statut]?.includes(e.type)) continue;
      // Créneau + 1 h : dans toutes les plages horaires, pour ne tester que le statut
      assert.deepEqual(faireEvoluerReservation(etat(statut), e, CRENEAU + HEURE), { ok: false, erreur: "transition-interdite" }, `${statut} + ${e.type}`);
    }
  }
  assert.deepEqual(faireEvoluerReservation({ statut: "acceptee", creneau: "bientôt", presenceLe: null }, { type: "venu" }, CRENEAU), {
    ok: false,
    erreur: "transition-interdite",
  });
});

test("heure de Paris : été, hiver et jours de changement d'heure", () => {
  assert.equal(calculerInstantParis("2026-10-09", "20:00"), CRENEAU);
  assert.equal(calculerInstantParis("2026-12-15", "20:00"), Date.parse("2026-12-15T19:00:00.000Z"));
  assert.equal(calculerInstantParis("2026-10-25", "12:00"), Date.parse("2026-10-25T11:00:00.000Z"));
  assert.equal(calculerInstantParis("2026-10-25", "01:30"), Date.parse("2026-10-24T23:30:00.000Z"));
  assert.equal(calculerInstantParis("2026-03-29", "12:00"), Date.parse("2026-03-29T10:00:00.000Z"));
  assert.equal(calculerInstantParis("2026-03-29", "01:30"), Date.parse("2026-03-29T00:30:00.000Z"));
  assert.equal(calculerDecalageParis(Date.parse("2026-10-25T00:59:59.999Z")), 2 * HEURE);
  assert.equal(calculerDecalageParis(Date.parse("2026-10-25T01:00:00.000Z")), HEURE);
  for (const [jour, heure] of [["2026-02-30", "12:00"], ["2026-10-09", "24:00"], ["9 octobre", "12:00"], ["2026-10-09", "8h"]]) {
    assert.ok(Number.isNaN(calculerInstantParis(jour, heure)), `${jour} ${heure}`);
  }
});

const nonna: CreneauOuverture[] = [
  { jours: [0, 1, 2, 3, 4, 5, 6], de: "12:00", a: "14:30" },
  { jours: [0, 1, 2, 3, 4, 5, 6], de: "19:00", a: "22:30" },
];
/** Vendredi 9 octobre 2026, 12 h 00 à Paris */
const MIDI = new Date("2026-10-09T10:00:00.000Z");

test("créneaux : toutes les 30 min dans les horaires, jusqu'à la dernière demi-heure avant la fermeture", () => {
  assert.deepEqual(listerCreneauxReservation(nonna, "2026-10-10", MIDI), [
    "12:00", "12:30", "13:00", "13:30", "14:00", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
  ]);
  // Ouverture à une heure bizarre : on commence à la demi-heure suivante
  assert.deepEqual(listerCreneauxReservation([{ jours: [6], de: "11:45", a: "13:00" }], "2026-10-10", MIDI), ["12:00", "12:30"]);
  // Jour fermé
  assert.deepEqual(listerCreneauxReservation([{ jours: [1, 2], de: "12:00", a: "14:00" }], "2026-10-10", MIDI), []);
});

test("créneaux : au moins 30 min après maintenant", () => {
  const a19h10 = new Date("2026-10-09T17:10:00.000Z");
  assert.deepEqual(listerCreneauxReservation(nonna, "2026-10-09", a19h10), ["20:00", "20:30", "21:00", "21:30", "22:00"]);
  const a19h = new Date("2026-10-09T17:00:00.000Z");
  assert.equal(listerCreneauxReservation(nonna, "2026-10-09", a19h)[0], "19:30");
  assert.deepEqual(listerCreneauxReservation(nonna, "2026-10-09", new Date("2026-10-09T20:00:00.000Z")), []);
});

test("créneaux : une ouverture qui passe minuit s'arrête à 23 h 30", () => {
  const bar: CreneauOuverture[] = [{ jours: [5], de: "18:00", a: "01:00" }];
  const creneaux = listerCreneauxReservation(bar, "2026-10-09", MIDI);
  assert.equal(creneaux[0], "18:00");
  assert.equal(creneaux.at(-1), "23:30");
  assert.equal(creneaux.length, 12);
  assert.equal(listerCreneauxReservation([{ jours: [5], de: "17:00", a: "00:00" }], "2026-10-09", MIDI).at(-1), "23:30");
  // Le lendemain matin (après minuit) n'est pas proposé
  assert.deepEqual(listerCreneauxReservation(bar, "2026-10-10", MIDI), []);
});

test("créneaux : d'aujourd'hui à dans 30 jours, jour mal écrit refusé", () => {
  assert.deepEqual(listerCreneauxReservation(nonna, "2026-10-08", MIDI), []);
  assert.equal(listerCreneauxReservation(nonna, "2026-11-08", MIDI).length, 12);
  assert.deepEqual(listerCreneauxReservation(nonna, "2026-11-09", MIDI), []);
  assert.deepEqual(listerCreneauxReservation(nonna, "2026-02-30", MIDI), []);
  assert.deepEqual(listerCreneauxReservation(nonna, "demain", MIDI), []);
  // Juste avant minuit à Paris (22 h 30 UTC), « aujourd'hui » est déjà le lendemain
  assert.equal(listerCreneauxReservation(nonna, "2026-10-10", new Date("2026-10-09T22:30:00.000Z"))[0], "12:00");
  assert.equal(listerCreneauxReservation(nonna, "2026-11-09", new Date("2026-10-09T22:30:00.000Z")).length, 12);
});
