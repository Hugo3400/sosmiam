import { test } from "node:test";
import assert from "node:assert/strict";
import type { CreneauOuverture } from "../src/types/lieu.ts";
import type { OccupationReservation, ReglagesReservations, ServiceReservation } from "../src/types/reglages-reservations.ts";
import { calculerCouvertsMaxService } from "../src/fonctions/reservations/calculer-couverts-max-service.ts";
import { calculerPersonnesMax } from "../src/fonctions/reservations/calculer-personnes-max.ts";
import { listerCreneauxDisponibles } from "../src/fonctions/reservations/lister-creneaux-disponibles.ts";
import { listerReservationsARevoir } from "../src/fonctions/reservations/lister-reservations-a-revoir.ts";
import { calculerInstantParis } from "../src/fonctions/temps/calculer-instant-paris.ts";
import { existeHeureParis } from "../src/fonctions/temps/existe-heure-paris.ts";
import { validerReglagesReservations } from "../src/validation/valider-reglages-reservations.ts";

const OUVERTURE: CreneauOuverture[] = [
  { jours: [2, 3, 4, 5, 6], de: "12:00", a: "14:30" },
  { jours: [2, 3, 4, 5, 6], de: "19:00", a: "23:00" },
];
const MIDI: ServiceReservation = { jours: [2, 3, 4, 5, 6], premier: "12:00", dernier: "13:30", pas: 30, couvertsParService: 24, couvertsParCreneau: 10 };
const SOIR: ServiceReservation = { jours: [2, 3, 4, 5, 6], premier: "19:00", dernier: "21:00", pas: 15, couvertsParService: 72, couvertsParCreneau: 8 };
const REGLAGES: ReglagesReservations = { acceptation: "automatique", delai: "1-h", services: [MIDI, SOIR], joursFermes: ["2026-10-24"] };
const VENDREDI_10H = new Date(calculerInstantParis("2026-10-16", "10:00"));
const a = (heure: string, jour = "2026-10-17") => new Date(calculerInstantParis(jour, heure)).toISOString();
const prise = (heure: string, personnes: number, jour = "2026-10-17"): OccupationReservation => ({ creneau: a(heure, jour), personnes });
const heures = (o: { reglages?: ReglagesReservations | null; jour?: string; maintenant?: Date; occupees?: OccupationReservation[]; personnes?: number; ouverture?: CreneauOuverture[] }) =>
  listerCreneauxDisponibles({
    ouverture: o.ouverture ?? OUVERTURE, reglages: o.reglages === undefined ? REGLAGES : o.reglages, jour: o.jour ?? "2026-10-17",
    maintenant: o.maintenant ?? VENDREDI_10H, occupees: o.occupees, personnes: o.personnes,
  }).map((c) => c.heure);

test("les services du lieu : midi toutes les 30 min, soir toutes les 15 min, la dernière table comprise", () => {
  assert.deepEqual(heures({}), ["12:00", "12:30", "13:00", "13:30", "19:00", "19:15", "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00"]);
});

test("jour fermé à la réservation, jour sans service : aucun créneau, même si la fiche dit ouvert", () => {
  assert.deepEqual(heures({ jour: "2026-10-24" }), []);
  assert.deepEqual(heures({ jour: "2026-10-18" }), []);
  assert.deepEqual(heures({ jour: "2026-10-19" }), []);
});

test("délai du lieu : 1 h par défaut, 2 h, et « la veille » jusqu'à 23 h 59 (heure de Paris), jamais le jour même", () => {
  const onzeHeuresQuart = new Date(calculerInstantParis("2026-10-16", "11:15"));
  assert.deepEqual(heures({ jour: "2026-10-16", maintenant: onzeHeuresQuart }).slice(0, 2), ["12:30", "13:00"]);
  assert.deepEqual(heures({ jour: "2026-10-16", maintenant: onzeHeuresQuart, reglages: { ...REGLAGES, delai: "2-h" } }).slice(0, 2), ["13:30", "19:00"]);
  const veille = { ...REGLAGES, delai: "veille" as const };
  assert.deepEqual(heures({ jour: "2026-10-16", reglages: veille }), []);
  assert.equal(heures({ reglages: veille, maintenant: new Date(calculerInstantParis("2026-10-16", "23:59")) })[0], "12:00");
  assert.deepEqual(heures({ reglages: veille, maintenant: new Date(calculerInstantParis("2026-10-17", "00:00")) }), []);
  assert.deepEqual(heures({ reglages: veille, maintenant: new Date(calculerInstantParis("2026-10-17", "00:05")) }), []);
});

test("« la veille » la nuit du passage à l'heure d'hiver (25 octobre 2026) : c'est le calendrier de Paris qui compte, pas 24 h", () => {
  const dimanche: ReglagesReservations = { ...REGLAGES, delai: "veille", services: [{ ...MIDI, jours: [0] }], joursFermes: [] };
  const samedi2359 = new Date(calculerInstantParis("2026-10-24", "23:59"));
  assert.equal(samedi2359.toISOString(), "2026-10-24T21:59:00.000Z");
  assert.deepEqual(heures({ reglages: dimanche, jour: "2026-10-25", maintenant: samedi2359 }), ["12:00", "12:30", "13:00", "13:30"]);
  assert.equal(a("12:00", "2026-10-25"), "2026-10-25T11:00:00.000Z");
  const dimanche0030 = new Date(calculerInstantParis("2026-10-25", "00:30"));
  assert.equal(dimanche0030.toISOString(), "2026-10-24T22:30:00.000Z");
  assert.deepEqual(heures({ reglages: dimanche, jour: "2026-10-25", maintenant: dimanche0030 }), []);
});

test("« la veille » la nuit du passage à l'heure d'été (29 mars 2026) : la veille à 23 h 59, oui ; minuit passé, non", () => {
  const dimanche: ReglagesReservations = { ...REGLAGES, delai: "veille", services: [{ ...SOIR, jours: [0] }], joursFermes: [] };
  const samedi2359 = new Date(calculerInstantParis("2026-03-28", "23:59"));
  assert.equal(samedi2359.toISOString(), "2026-03-28T22:59:00.000Z");
  assert.equal(heures({ reglages: dimanche, jour: "2026-03-29", maintenant: samedi2359 })[0], "19:00");
  assert.equal(a("19:00", "2026-03-29"), "2026-03-29T17:00:00.000Z");
  assert.deepEqual(heures({ reglages: dimanche, jour: "2026-03-29", maintenant: new Date(calculerInstantParis("2026-03-29", "00:01")) }), []);
});

test("passage à l'heure d'été (28 mars 2027) : 2 h 00 à 2 h 59 n'existent pas, jamais proposées (horaires d'ouverture ou services)", () => {
  assert.equal(existeHeureParis("2027-03-28", "02:30"), false);
  assert.equal(existeHeureParis("2027-03-28", "03:00"), true);
  assert.equal(existeHeureParis("2026-10-25", "02:30"), true);
  const nuit: CreneauOuverture[] = [{ jours: [0], de: "00:00", a: "04:00" }];
  const samedi = new Date(calculerInstantParis("2027-03-27", "12:00"));
  assert.deepEqual(heures({ ouverture: nuit, reglages: null, jour: "2027-03-28", maintenant: samedi }), ["00:00", "00:30", "01:00", "01:30", "03:00", "03:30"]);
  const service: ServiceReservation = { jours: [0], premier: "00:00", dernier: "03:00", pas: 30, couvertsParService: 28, couvertsParCreneau: 4 };
  const deNuit: ReglagesReservations = { acceptation: "manuelle", delai: "1-h", services: [service], joursFermes: [] };
  assert.deepEqual(heures({ reglages: deNuit, jour: "2027-03-28", maintenant: samedi }), ["00:00", "00:30", "01:00", "01:30", "03:00"]);
});

test("arrivées par créneau : un créneau sans la place pour le groupe disparaît pour ce groupe seulement", () => {
  const occupees = [prise("12:00", 8)];
  assert.ok(heures({ occupees, personnes: 2 }).includes("12:00"));
  assert.ok(!heures({ occupees, personnes: 3 }).includes("12:00"));
  assert.ok(heures({ occupees, personnes: 3 }).includes("12:30"));
});

test("couverts du service : la salle se remplit même quand chaque créneau a encore de la place", () => {
  const occupees = [prise("12:00", 10), prise("12:30", 10)];
  assert.ok(!heures({ occupees, personnes: 5 }).includes("13:00"));
  assert.ok(heures({ occupees, personnes: 4 }).includes("13:00"));
  assert.ok(heures({ occupees, personnes: 5 }).includes("19:00"));
});

test("couverts du service : décaler le service d'un quart d'heure ne fait pas sortir les tables déjà prises", () => {
  const soir40: ServiceReservation = { jours: [2, 3, 4, 5, 6], premier: "19:00", dernier: "21:30", pas: 15, couvertsParService: 40, couvertsParCreneau: 8 };
  const occupees = ["19:00", "19:15", "19:30", "19:45", "20:00"].map((h) => prise(h, 8));
  const avant: ReglagesReservations = { ...REGLAGES, services: [MIDI, soir40], joursFermes: [] };
  assert.deepEqual(heures({ reglages: avant, occupees, personnes: 1 }).filter((h) => h >= "19:00"), []);
  const decale = { ...avant, services: [MIDI, { ...soir40, premier: "19:15" }] };
  assert.deepEqual(heures({ reglages: decale, occupees, personnes: 1 }).filter((h) => h >= "19:00"), [], "la table de 19 h compte toujours");
  const aRevoir = listerReservationsARevoir(decale, occupees.map((o, i) => ({ id: i + 1, ...o, statut: "acceptee" as const })), VENDREDI_10H);
  assert.deepEqual(aRevoir.map((r) => [r.id, r.raison]), [[1, "hors-service"]]);
});

test("une table à 19 h 15 reste comptée quand le soir passe de 15 à 30 min : elle tombe dans le créneau de 19 h", () => {
  const soir30: ReglagesReservations = { ...REGLAGES, services: [MIDI, { ...SOIR, pas: 30 }] };
  assert.ok(heures({ reglages: soir30, occupees: [prise("19:15", 6)], personnes: 2 }).includes("19:00"));
  assert.ok(!heures({ reglages: soir30, occupees: [prise("19:15", 6)], personnes: 3 }).includes("19:00"));
});

test("capacité baissée sous ce qui est déjà pris : le créneau disparaît, sans nombre négatif ni plantage", () => {
  const baisse: ReglagesReservations = { ...REGLAGES, services: [MIDI, { ...SOIR, couvertsParCreneau: 4 }] };
  assert.ok(!heures({ reglages: baisse, occupees: [prise("20:00", 8)], personnes: 1 }).includes("20:00"));
});

test("réglages : 30 min aussi à la main ; automatique sans service et services qui se chevauchent refusés", () => {
  assert.equal(validerReglagesReservations({ ...REGLAGES, delai: "30-min" }).ok, true);
  assert.equal(validerReglagesReservations({ ...REGLAGES, acceptation: "manuelle", delai: "30-min" }).ok, true);
  assert.deepEqual(validerReglagesReservations({ ...REGLAGES, services: [] }), { ok: false, champ: "acceptation" });
  assert.deepEqual(validerReglagesReservations({ ...REGLAGES, services: [MIDI, { ...MIDI, jours: [6], premier: "13:30", dernier: "14:00" }] }), {
    ok: false, champ: "services.1.premier",
  });
});

test("groupe max proposé : 12 au plus, jamais plus que ce qu'un créneau peut accueillir", () => {
  assert.equal(calculerPersonnesMax(null), 12);
  assert.equal(calculerPersonnesMax(REGLAGES), 10);
  assert.equal(calculerPersonnesMax({ ...REGLAGES, services: [{ ...MIDI, couvertsParCreneau: 40, couvertsParService: 60 }] }), 12);
  assert.equal(calculerPersonnesMax({ ...REGLAGES, services: [{ ...MIDI, couvertsParCreneau: 6, couvertsParService: 4 }] }), 4);
});

test("couverts possibles sur un service (aide aux réglages) : créneaux × arrivées, jamais plus que les couverts du service", () => {
  assert.equal(calculerCouvertsMaxService(MIDI), 24);
  assert.equal(calculerCouvertsMaxService(SOIR), 72);
  assert.equal(calculerCouvertsMaxService({ ...SOIR, couvertsParService: 40 }), 40);
  assert.equal(calculerCouvertsMaxService({ ...SOIR, dernier: "18:00" }), null);
});
