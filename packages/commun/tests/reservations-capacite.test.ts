import { test } from "node:test";
import assert from "node:assert/strict";
import type { CreneauOuverture } from "../src/types/lieu.ts";
import type { OccupationReservation, ReglagesReservations, ServiceReservation } from "../src/types/reglages-reservations.ts";
import { calculerPlaceHoraire } from "../src/fonctions/reservations/calculer-place-horaire.ts";
import { calculerPlacesRestantes } from "../src/fonctions/reservations/calculer-places-restantes.ts";
import { listerCreneauxDisponibles } from "../src/fonctions/reservations/lister-creneaux-disponibles.ts";
import { listerCreneauxReservation } from "../src/fonctions/reservations/lister-creneaux-reservation.ts";
import { listerReservationsARevoir } from "../src/fonctions/reservations/lister-reservations-a-revoir.ts";
import { calculerInstantParis } from "../src/fonctions/temps/calculer-instant-paris.ts";
import { DELAIS_RESERVATION_MS, REGLAGES_RESERVATIONS_DEFAUT } from "../src/regles/reglages-reservations.ts";
import { DELAI_MIN_RESERVATION_MS } from "../src/regles/reservations.ts";
import { validerDemandeReservation } from "../src/validation/valider-demande-reservation.ts";
import { validerReglagesReservations } from "../src/validation/valider-reglages-reservations.ts";

const OUVERTURE: CreneauOuverture[] = [{ jours: [0, 1, 2, 3, 4, 5, 6], de: "12:00", a: "14:30" }, { jours: [0, 1, 2, 3, 4, 5, 6], de: "19:00", a: "23:00" }];
const MIDI: ServiceReservation = { jours: [2, 3, 4, 5, 6], premier: "12:00", dernier: "13:30", pas: 15, couvertsParService: 70, couvertsParCreneau: 10 };
const SOIR: ServiceReservation = { jours: [0, 1, 2, 3, 4, 5, 6], premier: "19:00", dernier: "21:30", pas: 30, couvertsParService: 60, couvertsParCreneau: 10 };
const reglages = (r: Partial<ReglagesReservations> = {}): ReglagesReservations => ({ services: [MIDI, SOIR], acceptation: "automatique", delai: "1-h", joursFermes: [], ...r });
const occupee = (jour: string, heure: string, personnes: number): OccupationReservation => ({ creneau: new Date(calculerInstantParis(jour, heure)).toISOString(), personnes });
const heures = (r: ReglagesReservations | null, jour: string, maintenant: Date, o: { occupees?: OccupationReservation[]; personnes?: number } = {}) =>
  listerCreneauxDisponibles({ ouverture: OUVERTURE, reglages: r, jour, maintenant, ...o }).map((c) => c.heure);
const places = (r: ReglagesReservations, jour: string, minute: number, occupees: OccupationReservation[], service = SOIR) =>
  calculerPlacesRestantes({ services: r.services, service, jour, minute }, occupees);

const JEUDI_MATIN = new Date("2026-10-15T08:00:00.000Z");
const SOIREE = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const MIDI_15 = ["12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30"];

test("sans réglage : exactement les créneaux d'avant (horaires d'ouverture, toutes les 30 min, 1 h de délai)", () => {
  assert.deepEqual([REGLAGES_RESERVATIONS_DEFAUT.delai, DELAIS_RESERVATION_MS["1-h"]], ["1-h", DELAI_MIN_RESERVATION_MS]);
  for (const [jour, maintenant] of [["2026-10-15", JEUDI_MATIN], ["2026-10-15", new Date("2026-10-15T10:40:00.000Z")], ["2026-10-25", JEUDI_MATIN], ["2026-11-14", JEUDI_MATIN]] as const) {
    const avant = listerCreneauxReservation(OUVERTURE, jour, maintenant);
    assert.deepEqual(heures(null, jour, maintenant), avant, jour);
    assert.deepEqual(heures({ ...REGLAGES_RESERVATIONS_DEFAUT }, jour, maintenant), avant, `${jour} (réglages par défaut)`);
  }
  assert.deepEqual(listerCreneauxReservation(OUVERTURE, "2026-10-15", new Date("2026-10-15T10:40:00.000Z")).slice(0, 3), ["14:00", "19:00", "19:30"]);
  assert.ok(listerCreneauxDisponibles({ ouverture: OUVERTURE, reglages: null, jour: "2026-10-16", maintenant: JEUDI_MATIN }).every((c) => !c.peuDePlaces));
});

test("services : seuls leurs créneaux comptent, par jour de la semaine, toutes les 15 ou 30 min", () => {
  assert.deepEqual(heures(reglages(), "2026-10-16", JEUDI_MATIN), [...MIDI_15, ...SOIREE], "vendredi : midi et soir");
  assert.deepEqual(heures(reglages(), "2026-10-18", JEUDI_MATIN), SOIREE, "dimanche : le soir seulement");
  assert.deepEqual(heures(reglages({ services: [MIDI] }), "2026-10-19", JEUDI_MATIN), [], "lundi sans service : fermé à la réservation");
  assert.deepEqual(heures(reglages(), "2026-11-15", JEUDI_MATIN), [], "plus de 30 jours : rien");
  assert.deepEqual(heures(reglages(), "2026-10-14", JEUDI_MATIN), [], "hier : rien");
});

test("jours fermés : plus aucun créneau ce jour-là, même sans service réglé", () => {
  assert.deepEqual(heures(reglages({ joursFermes: ["2026-10-16"] }), "2026-10-16", JEUDI_MATIN), []);
  assert.deepEqual(heures({ ...REGLAGES_RESERVATIONS_DEFAUT, joursFermes: ["2026-10-16"] }, "2026-10-16", JEUDI_MATIN), []);
  assert.deepEqual(heures(reglages({ joursFermes: ["2026-10-16"] }), "2026-10-17", JEUDI_MATIN), [...MIDI_15, ...SOIREE]);
});

test("délai : 30 min, 1 h, 2 h ou la veille (minuit à Paris), à la main comme en automatique", () => {
  const a11h40 = new Date("2026-10-16T09:40:00.000Z");
  for (const acceptation of ["automatique", "manuelle"] as const) {
    assert.deepEqual(heures(reglages({ acceptation, delai: "30-min" }), "2026-10-16", a11h40).slice(0, 2), ["12:15", "12:30"], acceptation);
    assert.deepEqual(heures(reglages({ acceptation, delai: "1-h" }), "2026-10-16", a11h40).slice(0, 2), ["12:45", "13:00"], acceptation);
    assert.deepEqual(heures(reglages({ acceptation, delai: "2-h" }), "2026-10-16", a11h40), SOIREE, acceptation);
  }
  const veille = reglages({ delai: "veille" });
  assert.deepEqual(heures(veille, "2026-10-16", a11h40), [], "le jour même : non");
  assert.deepEqual(heures(veille, "2026-10-17", new Date("2026-10-16T21:59:00.000Z")), [...MIDI_15, ...SOIREE], "la veille à 23 h 59 : oui");
  assert.deepEqual(heures(veille, "2026-10-17", new Date("2026-10-16T22:00:00.000Z")), [], "minuit passé : c'est le jour même");
});

test("arrivées par créneau : un créneau complet disparaît pour ce groupe ; une table mal alignée compte dans son créneau", () => {
  const occupees = [occupee("2026-10-16", "19:00", 6), occupee("2026-10-16", "19:15", 2)];
  assert.deepEqual(heures(reglages(), "2026-10-16", JEUDI_MATIN, { occupees, personnes: 2 }).filter((h) => h >= "19:00"), SOIREE);
  assert.deepEqual(heures(reglages(), "2026-10-16", JEUDI_MATIN, { occupees, personnes: 3 }).filter((h) => h >= "19:00"), SOIREE.slice(1));
  const peu = listerCreneauxDisponibles({ ouverture: OUVERTURE, reglages: reglages(), jour: "2026-10-16", maintenant: JEUDI_MATIN, occupees, personnes: 2 });
  assert.deepEqual(peu.filter((c) => c.peuDePlaces).map((c) => c.heure), ["19:00"]);
  assert.equal(places(reglages(), "2026-10-16", 19 * 60, occupees), 2);
  assert.equal(places(reglages(), "2026-10-16", 19 * 60 + 30, occupees), 10);
});

test("couverts du service : tout le service se ferme quand ils sont atteints, l'autre service reste ouvert", () => {
  const soir = { ...SOIR, couvertsParService: 20 };
  const occupees = [occupee("2026-10-16", "19:00", 10), occupee("2026-10-16", "20:30", 9)];
  const r = reglages({ services: [MIDI, soir] });
  assert.deepEqual(heures(r, "2026-10-16", JEUDI_MATIN, { occupees, personnes: 2 }), MIDI_15);
  assert.deepEqual(heures(r, "2026-10-16", JEUDI_MATIN, { occupees, personnes: 1 }), [...MIDI_15, ...SOIREE.filter((h) => h !== "19:00")]);
  assert.equal(places(r, "2026-10-16", 20 * 60, occupees, soir), 1);
});

test("changement d'heure : les créneaux et les tables tombent au bon endroit (25 octobre et 29 mars)", () => {
  assert.equal(occupee("2026-10-25", "19:00", 1).creneau, "2026-10-25T18:00:00.000Z");
  assert.equal(occupee("2026-03-29", "19:00", 1).creneau, "2026-03-29T17:00:00.000Z");
  for (const jour of ["2026-10-25", "2026-03-29"]) {
    const occupees = [occupee(jour, "19:00", 10)];
    assert.equal(places(reglages(), jour, 19 * 60, occupees), 0, jour);
    assert.equal(places(reglages(), jour, 19 * 60 + 30, occupees), 10, jour);
  }
  assert.deepEqual(heures(reglages(), "2026-10-25", JEUDI_MATIN, { occupees: [occupee("2026-10-25", "19:00", 10)] }), SOIREE.slice(1));
  assert.deepEqual(calculerPlaceHoraire(reglages(), [occupee("2026-10-25", "21:30", 4)], "2026-10-25T20:30:00.000Z"), {
    places: 6, horsReglages: false, jourFerme: false,
  });
});

test("places d'un horaire : null sans service, sinon ce qui reste (négatif : déjà trop) ; hors service : les couverts du service voisin", () => {
  const creneau = new Date(calculerInstantParis("2026-10-16", "19:00")).toISOString();
  const rien = { places: null, horsReglages: false, jourFerme: false };
  assert.deepEqual(calculerPlaceHoraire(null, [], creneau), rien);
  assert.deepEqual(calculerPlaceHoraire({ ...REGLAGES_RESERVATIONS_DEFAUT }, [], creneau), rien);
  assert.deepEqual(calculerPlaceHoraire({ ...REGLAGES_RESERVATIONS_DEFAUT, joursFermes: ["2026-10-16"] }, [], creneau), { ...rien, jourFerme: true });
  assert.equal(calculerPlaceHoraire(reglages(), [occupee("2026-10-16", "19:00", 12)], creneau).places, -2);
  const seize = new Date(calculerInstantParis("2026-10-16", "15:00")).toISOString();
  assert.deepEqual(calculerPlaceHoraire(reglages(), [occupee("2026-10-16", "12:00", 9)], seize), { places: 61, horsReglages: true, jourFerme: false });
  const loin = new Date(calculerInstantParis("2026-10-16", "16:30")).toISOString();
  assert.deepEqual(calculerPlaceHoraire(reglages(), [], loin), { places: null, horsReglages: true, jourFerme: false }, "à plus de 2 h de tout service");
});

test("réglages valides : jours triés sans doublon, arrivées par créneau pré-remplies avec les couverts du service, jours fermés ignorés", () => {
  const brut = {
    services: [{ ...MIDI, jours: [6, 2, 2, 5] }, { ...SOIR, couvertsParCreneau: undefined }],
    acceptation: "automatique", delai: "veille", joursFermes: ["2026-10-20"], enTrop: true,
  };
  assert.deepEqual(validerReglagesReservations(brut), {
    ok: true,
    reglages: { services: [{ ...MIDI, jours: [2, 5, 6] }, { ...SOIR, couvertsParCreneau: 60 }], acceptation: "automatique", delai: "veille" },
  });
  const autreJour = { ...MIDI, jours: [0, 1], premier: "12:30", dernier: "14:00", pas: 30 };
  assert.equal(validerReglagesReservations({ ...reglages(), services: [MIDI, autreJour] }).ok, true, "même heure, autres jours");
  const colle = { ...MIDI, jours: [5], premier: "13:45", dernier: "14:30" };
  assert.equal(validerReglagesReservations({ ...reglages(), services: [MIDI, colle] }).ok, true, "un service juste après l'autre");
  assert.equal(validerReglagesReservations({ ...reglages(), acceptation: "manuelle", delai: "30-min" }).ok, true, "30 min à la main");
  const tard = [{ ...SOIR, jours: [0, 2, 3, 4, 5, 6], premier: "23:00", dernier: "23:45", pas: 15 }, { ...SOIR, jours: [1], premier: "23:00", dernier: "23:30", pas: 30 }];
  assert.equal(validerReglagesReservations({ ...reglages(), services: tard }).ok, true, "le dernier créneau finit à minuit pile");
});

test("réglages refusés : chaque erreur nomme son champ", () => {
  const cas: [Record<string, unknown>, string][] = [
    [{ services: [MIDI, { ...MIDI, jours: [5], premier: "13:00", dernier: "14:00" }] }, "services.1.premier"],
    [{ services: [MIDI, { ...MIDI, jours: [5], premier: "13:30", dernier: "14:00" }] }, "services.1.premier"],
    [{ services: [{ ...MIDI, pas: 20 }] }, "services.0.pas"],
    [{ services: [{ ...MIDI, jours: [] }] }, "services.0.jours"],
    [{ services: [{ ...MIDI, jours: [7] }] }, "services.0.jours"],
    [{ services: [{ ...MIDI, premier: "12:10" }] }, "services.0.premier"],
    [{ services: [{ ...MIDI, premier: "24:00" }] }, "services.0.premier"],
    [{ services: [{ ...MIDI, dernier: "11:45" }] }, "services.0.dernier"],
    [{ services: [{ ...SOIR, dernier: "21:15" }] }, "services.0.dernier"],
    [{ services: [{ ...SOIR, premier: "23:30", dernier: "23:59" }] }, "services.0.dernier"],
    [{ services: [{ ...SOIR, premier: "22:45", dernier: "23:45" }] }, "services.0.dernier"],
    [{ services: [{ ...MIDI, couvertsParService: undefined }] }, "services.0.couvertsParService"],
    [{ services: [{ ...MIDI, couvertsParService: null }] }, "services.0.couvertsParService"],
    [{ services: [{ ...MIDI, couvertsParService: 0 }] }, "services.0.couvertsParService"],
    [{ services: [{ ...MIDI, couvertsParService: 3001 }] }, "services.0.couvertsParService"],
    [{ services: [{ ...MIDI, couvertsParCreneau: 0 }] }, "services.0.couvertsParCreneau"],
    [{ services: [{ ...MIDI, couvertsParCreneau: 2.5 }] }, "services.0.couvertsParCreneau"],
    [{ services: [{ ...MIDI, couvertsParCreneau: 71 }] }, "services.0.couvertsParCreneau"],
    [{ services: Array.from({ length: 13 }, (_, i) => ({ ...MIDI, jours: [i % 7] })) }, "services"],
    [{ services: "midi" }, "services"],
    [{ services: [], acceptation: "automatique" }, "acceptation"],
    [{ acceptation: "parfois" }, "acceptation"],
    [{ delai: "3-h" }, "delai"],
  ];
  for (const [modif, champ] of cas) assert.deepEqual(validerReglagesReservations({ ...reglages(), ...modif }), { ok: false, champ }, JSON.stringify(modif));
  assert.deepEqual(validerReglagesReservations(null), { ok: false, champ: "reglages" });
});

test("demande à plusieurs horaires : 3 au plus, le même jour, sans doublon ; complet si aucun n'a de place", () => {
  const demande = { lieuId: 1, personnes: 4, jour: "2026-10-16", heure: "19:00", message: null };
  const capacite = { reglages: reglages(), occupees: [occupee("2026-10-16", "19:00", 8), occupee("2026-10-16", "19:30", 7)] };
  const valider = (d: Record<string, unknown>) => validerDemandeReservation({ ...demande, ...d } as never, OUVERTURE, JEUDI_MATIN, capacite);
  assert.equal(valider({ autresHeures: ["19:30", "20:00"] }), null, "le troisième a de la place");
  assert.equal(valider({ autresHeures: ["19:30"] }), "creneau-complet");
  assert.equal(valider({}), "creneau-complet");
  assert.equal(valider({ personnes: 2 }), null);
  assert.equal(valider({ autresHeures: ["19:30", "20:00", "20:30"] }), "creneau-invalide", "4 horaires");
  assert.equal(valider({ autresHeures: ["20:00", "20:00"] }), "creneau-invalide", "doublon");
  assert.equal(valider({ autresHeures: ["19:00"] }), "creneau-invalide", "doublon avec le premier");
  assert.equal(valider({ autresHeures: ["17:00"] }), "creneau-invalide", "hors service");
  assert.equal(valider({ autresHeures: "20:00" }), "creneau-invalide");
  assert.equal(valider({ autresHeures: [20] }), "creneau-invalide");
  assert.equal(valider({ autresHeures: null }), "creneau-complet", "null : comme absent");
  assert.equal(valider({ personnes: 2, message: "connard" }), "message-refuse");
  assert.equal(validerDemandeReservation({ ...demande, heure: "15:00" }, OUVERTURE, JEUDI_MATIN), "creneau-invalide", "sans réglage : fermé à 15 h");
  assert.equal(validerDemandeReservation({ ...demande, heure: "20:00", autresHeures: ["20:30"] }, OUVERTURE, JEUDI_MATIN), null, "sans réglage : pas de limite");
});

test("à revoir après un changement : jour fermé, hors des services, capacité dépassée (honorées comprises), seulement à venir", () => {
  const iso = (heure: string, jour = "2026-10-16") => new Date(calculerInstantParis(jour, heure)).toISOString();
  const reservations = [
    { id: 1, creneau: iso("19:00"), personnes: 6, statut: "acceptee" as const },
    { id: 2, creneau: iso("19:00"), personnes: 6, statut: "acceptee" as const },
    { id: 3, creneau: iso("19:00"), personnes: 6, statut: "demandee" as const },
    { id: 4, creneau: iso("16:00"), personnes: 2, statut: "acceptee" as const },
    { id: 5, creneau: iso("20:00"), personnes: 2, statut: "acceptee" as const },
    { id: 6, creneau: iso("20:00", "2026-10-17"), personnes: 2, statut: "demandee" as const },
    { id: 7, creneau: iso("20:00"), personnes: 9, statut: "honoree" as const },
    { id: 8, creneau: iso("20:00"), personnes: 9, statut: "annulee" as const },
    { id: 9, creneau: iso("12:00", "2026-10-15"), personnes: 2, statut: "acceptee" as const },
  ];
  const r = reglages({ joursFermes: ["2026-10-17"] });
  assert.deepEqual(listerReservationsARevoir(r, reservations, JEUDI_MATIN).map((x) => [x.id, x.raison]), [
    [1, "capacite"], [2, "capacite"], [4, "hors-service"], [5, "capacite"], [6, "jour-ferme"],
  ]);
  assert.deepEqual(listerReservationsARevoir({ ...REGLAGES_RESERVATIONS_DEFAUT }, reservations, JEUDI_MATIN), []);
  assert.deepEqual(listerReservationsARevoir(r, reservations, new Date(calculerInstantParis("2026-10-16", "19:30"))).map((x) => x.id), [5, 6]);
});
