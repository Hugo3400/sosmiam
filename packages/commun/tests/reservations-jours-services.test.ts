import { test } from "node:test";
import assert from "node:assert/strict";
import type { CreneauOuverture } from "../src/types/lieu.ts";
import type { OccupationReservation, ReglagesReservations, ServiceReservation } from "../src/types/reglages-reservations.ts";
import { creerServicesDepuisHoraires } from "../src/fonctions/reservations/creer-services-depuis-horaires.ts";
import { listerCreneauxDisponibles } from "../src/fonctions/reservations/lister-creneaux-disponibles.ts";
import { listerHeuresService } from "../src/fonctions/reservations/lister-heures-service.ts";
import { listerJoursReservation } from "../src/fonctions/reservations/lister-jours-reservation.ts";
import { listerServicesDuJour } from "../src/fonctions/reservations/lister-services-du-jour.ts";
import { lireMomentCreneau } from "../src/fonctions/reservations/lire-moment-creneau.ts";
import { nommerServiceReservation } from "../src/fonctions/reservations/nommer-service-reservation.ts";
import { calculerInstantParis } from "../src/fonctions/temps/calculer-instant-paris.ts";
import { decalerJour } from "../src/fonctions/temps/decaler-jour.ts";
import { validerReglagesReservations } from "../src/validation/valider-reglages-reservations.ts";

const OUVERTURE: CreneauOuverture[] = [
  { jours: [2, 3, 4, 5, 6], de: "12:00", a: "14:30" },
  { jours: [2, 3, 4, 5, 6], de: "19:00", a: "23:00" },
  { jours: [0], de: "12:00", a: "15:00" },
];
const MIDI: ServiceReservation = { jours: [2, 3, 4, 5, 6], premier: "12:00", dernier: "13:30", pas: 30, couvertsParService: 24, couvertsParCreneau: 10 };
const SOIR: ServiceReservation = { jours: [2, 3, 4, 5, 6], premier: "19:00", dernier: "21:00", pas: 15, couvertsParService: 40, couvertsParCreneau: 8 };
const REGLAGES: ReglagesReservations = { acceptation: "manuelle", delai: "1-h", services: [MIDI, SOIR], joursFermes: ["2026-10-23"] };
const VENDREDI_20H30 = new Date(calculerInstantParis("2026-10-16", "20:30"));
const prise = (jour: string, heure: string, personnes: number): OccupationReservation => ({ creneau: new Date(calculerInstantParis(jour, heure)).toISOString(), personnes });
const MARDI_PLEIN = [
  ...[["12:00", 10], ["12:30", 10], ["13:00", 4]].map(([h, p]) => prise("2026-10-20", h as string, p as number)),
  ...["19:00", "19:15", "19:30", "19:45", "20:00"].map((h) => prise("2026-10-20", h, 8)),
];
const MERCREDI_PRESQUE = [
  ...[["12:00", 10], ["12:30", 10], ["13:00", 3]].map(([h, p]) => prise("2026-10-21", h as string, p as number)),
  ...["19:00", "19:15", "19:30", "19:45"].map((h) => prise("2026-10-21", h, 8)),
  prise("2026-10-21", "20:00", 7),
];
const etats = (o: { reglages?: ReglagesReservations | null; occupees?: OccupationReservation[]; personnes?: number; maintenant?: Date } = {}) =>
  new Map(
    listerJoursReservation({
      ouverture: OUVERTURE, reglages: o.reglages === undefined ? REGLAGES : o.reglages, maintenant: o.maintenant ?? VENDREDI_20H30,
      occupees: o.occupees, personnes: o.personnes,
    }).map((j) => [j.jour, j.etat]),
  );

test("jours : d'aujourd'hui à dans 30 jours, avec les cinq états dans l'ordre de la règle", () => {
  const jours = listerJoursReservation({ ouverture: OUVERTURE, reglages: REGLAGES, maintenant: VENDREDI_20H30 });
  assert.equal(jours.length, 31);
  assert.deepEqual([jours[0]?.jour, jours[30]?.jour], ["2026-10-16", "2026-11-15"]);
  const e = etats({ occupees: [...MARDI_PLEIN, ...MERCREDI_PRESQUE], personnes: 2 });
  assert.equal(e.get("2026-10-16"), "trop-tard", "vendredi 20 h 30 : le dernier créneau (21 h) est à moins d'1 h");
  assert.equal(e.get("2026-10-17"), "ouvert");
  assert.equal(e.get("2026-10-18"), "sans-resa", "dimanche : la fiche est ouverte, mais aucun service");
  assert.equal(e.get("2026-10-19"), "ferme", "lundi : fermé sur la fiche, et aucun service");
  assert.equal(e.get("2026-10-20"), "complet", "mardi : midi et soir pleins");
  assert.equal(e.get("2026-10-21"), "complet", "mercredi : 1 place au midi et 1 le soir, pas 2");
  assert.equal(e.get("2026-10-23"), "sans-resa", "vendredi suivant : jour sans résa");
  assert.equal(etats({ occupees: MERCREDI_PRESQUE, personnes: 1 }).get("2026-10-21"), "ouvert");
});

test("jours sans réglage : la fiche fait foi (dimanche ouvert, lundi fermé), un jour sans résa garde son état", () => {
  const e = etats({ reglages: null });
  assert.deepEqual([e.get("2026-10-18"), e.get("2026-10-19"), e.get("2026-10-17")], ["ouvert", "ferme", "ouvert"]);
  const sansService = etats({ reglages: { ...REGLAGES, services: [] } });
  assert.deepEqual([sansService.get("2026-10-23"), sansService.get("2026-10-18")], ["sans-resa", "ouvert"]);
  const veille = etats({ reglages: { ...REGLAGES, delai: "veille" }, maintenant: new Date(calculerInstantParis("2026-10-16", "09:00")) });
  assert.deepEqual([veille.get("2026-10-16"), veille.get("2026-10-17")], ["trop-tard", "ouvert"]);
  assert.deepEqual(listerJoursReservation({ ouverture: OUVERTURE, reglages: null, maintenant: new Date(Number.NaN) }), []);
});

test("jours autour des changements d'heure : le 25 octobre et le 29 mars restent des jours entiers", () => {
  const dimanches: ReglagesReservations = { ...REGLAGES, services: [{ ...SOIR, jours: [0] }], joursFermes: [] };
  const automne = listerJoursReservation({ ouverture: OUVERTURE, reglages: dimanches, maintenant: new Date(calculerInstantParis("2026-10-24", "23:30")) });
  assert.deepEqual(automne.slice(0, 3).map((j) => [j.jour, j.etat]), [["2026-10-24", "sans-resa"], ["2026-10-25", "ouvert"], ["2026-10-26", "ferme"]]);
  const printemps = listerJoursReservation({ ouverture: OUVERTURE, reglages: dimanches, maintenant: new Date(calculerInstantParis("2026-03-28", "23:30")) });
  assert.deepEqual(printemps.slice(0, 2).map((j) => [j.jour, j.etat]), [["2026-03-28", "sans-resa"], ["2026-03-29", "ouvert"]]);
  assert.equal(printemps.length, 31);
  assert.equal(printemps[30]?.jour, decalerJour("2026-03-28", 30));
});

test("services du jour : triés, ouverts, complets pour ce groupe, ou trop tard ; rien un jour sans résa", () => {
  const lire = (jour: string, o: { maintenant?: Date; occupees?: OccupationReservation[]; personnes?: number; reglages?: ReglagesReservations | null } = {}) =>
    listerServicesDuJour({ reglages: o.reglages === undefined ? REGLAGES : o.reglages, jour, maintenant: o.maintenant ?? VENDREDI_20H30, occupees: o.occupees, personnes: o.personnes });
  assert.deepEqual(lire("2026-10-17"), [
    { premier: "12:00", dernier: "13:30", pas: 30, etat: "ouvert" },
    { premier: "19:00", dernier: "21:00", pas: 15, etat: "ouvert" },
  ]);
  assert.deepEqual(lire("2026-10-20", { occupees: MARDI_PLEIN, personnes: 1 }).map((s) => s.etat), ["complet", "complet"]);
  assert.deepEqual(lire("2026-10-21", { occupees: MERCREDI_PRESQUE, personnes: 2 }).map((s) => s.etat), ["complet", "complet"]);
  assert.deepEqual(lire("2026-10-21", { occupees: MERCREDI_PRESQUE, personnes: 1 }).map((s) => s.etat), ["ouvert", "ouvert"]);
  assert.deepEqual(lire("2026-10-16", { maintenant: new Date(calculerInstantParis("2026-10-16", "12:45")) }).map((s) => s.etat), ["trop-tard", "ouvert"]);
  assert.deepEqual(lire("2026-10-23"), [], "jour sans résa");
  assert.deepEqual(lire("2026-10-18"), [], "dimanche sans service");
  assert.deepEqual(lire("2026-10-17", { reglages: null }), [], "lieu sans service");
  assert.deepEqual(lire("2026-12-01"), [], "plus de 30 jours");
});

test("services du jour et créneaux disponibles disent la même chose", () => {
  for (const [jour, occupees, personnes] of [["2026-10-20", MARDI_PLEIN, 1], ["2026-10-21", MERCREDI_PRESQUE, 1], ["2026-10-21", MERCREDI_PRESQUE, 2]] as const) {
    const creneaux = listerCreneauxDisponibles({ ouverture: OUVERTURE, reglages: REGLAGES, jour, maintenant: VENDREDI_20H30, occupees, personnes });
    const services = listerServicesDuJour({ reglages: REGLAGES, jour, maintenant: VENDREDI_20H30, occupees, personnes });
    for (const service of services) {
      const dedans = creneaux.filter((c) => c.heure >= service.premier && c.heure <= service.dernier);
      assert.equal(dedans.length > 0, service.etat === "ouvert", `${jour} ${service.premier} pour ${personnes}`);
    }
  }
});

test("jours et créneaux disponibles disent la même chose : « ouvert » si et seulement si au moins un horaire tient", () => {
  const occupees = [...MARDI_PLEIN, ...MERCREDI_PRESQUE, prise("2026-10-22", "20:00", 8), prise("2026-10-24", "12:00", 10)];
  for (const personnes of [1, 2, 5, 9, 12]) {
    for (const { jour, etat } of listerJoursReservation({ ouverture: OUVERTURE, reglages: REGLAGES, maintenant: VENDREDI_20H30, occupees, personnes })) {
      const libres = listerCreneauxDisponibles({ ouverture: OUVERTURE, reglages: REGLAGES, jour, maintenant: VENDREDI_20H30, occupees, personnes });
      assert.equal(etat === "ouvert", libres.length > 0, `${jour} pour ${personnes}`);
    }
  }
});

test("nom d'un service : le moment de sa première arrivée, et un rang quand deux services du même moment partagent un jour", () => {
  assert.deepEqual(["10:30", "11:00", "14:45", "15:00", "17:45", "18:00"].map(lireMomentCreneau), ["matin", "midi", "midi", "apres-midi", "apres-midi", "soir"]);
  assert.deepEqual(nommerServiceReservation(MIDI, [MIDI, SOIR]), { moment: "midi", rang: null });
  const second = { ...SOIR, premier: "21:30", dernier: "22:30" };
  assert.deepEqual(nommerServiceReservation(SOIR, [MIDI, SOIR, second]), { moment: "soir", rang: 1 });
  assert.deepEqual(nommerServiceReservation(second, [MIDI, second, SOIR]), { moment: "soir", rang: 2 });
  const dimanche = { ...SOIR, jours: [0], premier: "20:00", dernier: "21:00" };
  assert.deepEqual(nommerServiceReservation(dimanche, [SOIR, dimanche]), { moment: "soir", rang: null }, "pas le même jour : pas de rang");
  const duJour = [{ premier: "19:00" }, { premier: "21:30" }];
  assert.deepEqual(nommerServiceReservation(duJour[1]!, duJour), { moment: "soir", rang: 2 });
  assert.deepEqual(nommerServiceReservation({ premier: "21:30" }, duJour), { moment: "soir", rang: 2 }, "une copie se range pareil");
});

test("heures d'un service : de la première à la dernière arrivée, bornes comprises, jamais après minuit", () => {
  assert.deepEqual(listerHeuresService(MIDI), ["12:00", "12:30", "13:00", "13:30"]);
  assert.equal(listerHeuresService(SOIR).length, 9);
  assert.deepEqual(listerHeuresService({ premier: "23:00", dernier: "23:45", pas: 15 }), ["23:00", "23:15", "23:30", "23:45"]);
  assert.deepEqual(listerHeuresService({ premier: "23:00", dernier: "23:45", pas: 30 }), ["23:00", "23:30"]);
  assert.deepEqual(listerHeuresService({ premier: "21:00", dernier: "19:00", pas: 15 }), []);
});

test("services pré-remplis depuis la fiche : exactement les créneaux d'aujourd'hui, valides, sans chevauchement", () => {
  const fiche: CreneauOuverture[] = [
    ...OUVERTURE,
    { jours: [5, 6], de: "23:00", a: "02:00" },
    { jours: [3], de: "14:00", a: "16:00" },
  ];
  const services = creerServicesDepuisHoraires(fiche, 40);
  const lu = validerReglagesReservations({ services, acceptation: "manuelle", delai: "1-h" });
  assert.equal(lu.ok, true, JSON.stringify(lu));
  assert.ok(services.every((s) => s.couvertsParService === 40 && s.couvertsParCreneau === 40 && s.pas === 30));
  const avecServices: ReglagesReservations = { services, acceptation: "manuelle", delai: "1-h", joursFermes: [] };
  const maintenant = new Date(calculerInstantParis("2026-10-14", "09:00"));
  for (let i = 0; i < 30; i += 1) {
    const jour = decalerJour("2026-10-14", i);
    const avant = listerCreneauxDisponibles({ ouverture: fiche, reglages: null, jour, maintenant }).map((c) => c.heure);
    const apres = listerCreneauxDisponibles({ ouverture: fiche, reglages: avecServices, jour, maintenant }).map((c) => c.heure);
    assert.deepEqual(apres, avant, jour);
  }
  const mercredi = services.filter((s) => s.jours.includes(3)).map((s) => [s.premier, s.dernier]);
  assert.deepEqual(mercredi, [["12:00", "15:30"], ["19:00", "22:30"]], "les horaires qui se touchent ne font qu'un service");
  assert.deepEqual(creerServicesDepuisHoraires([], 40), []);
});
