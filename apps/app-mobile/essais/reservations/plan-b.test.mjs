import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { ajusterChoixHoraires } from "~/fonctions/reservations/ajuster-choix-horaires";
import { basculerHoraireSecours } from "~/fonctions/reservations/basculer-horaire-secours";
import { ecrireHeuresSecours } from "~/fonctions/reservations/ecrire-heures-secours";
import { ecrireNomService } from "~/fonctions/reservations/ecrire-nom-service";
import { lireCreneauxLus } from "~/fonctions/reservations/lire-creneaux-lus";
import { lireHorairesReservation } from "~/fonctions/reservations/lire-horaires-reservation";
import { lireRaisonSansCreneau } from "~/fonctions/reservations/lire-raison-sans-creneau";
import { rangerCreneauxParService } from "~/fonctions/reservations/ranger-creneaux-par-service";

const iso = (heure, jour = "2026-10-23") => new Date(calculerInstantParis(jour, heure)).toISOString();
const dispo = (...heures) => heures.map((heure) => ({ heure, peuDePlaces: heure === "21:30" }));

test("les horaires se rangent par service, un service complet garde son titre", () => {
  const services = [
    { premier: "19:00", dernier: "21:30", pas: 15, etat: "ouvert" },
    { premier: "12:00", dernier: "13:30", pas: 30, etat: "complet" },
  ];
  const groupes = rangerCreneauxParService(dispo("19:00", "19:15", "21:30"), services);
  assert.deepEqual(groupes.map((g) => [g.nom.moment, g.etat, g.creneaux.map((c) => c.heure)]), [
    ["midi", "complet", []],
    ["soir", "ouvert", ["19:00", "19:15", "21:30"]],
  ]);
  assert.equal(groupes[1].creneaux[2].peuDePlaces, true);
});

test("deux services le soir : « Le soir, 1er service » et « Le soir, 2e service »", () => {
  const services = [
    { premier: "21:00", dernier: "22:00", pas: 30, etat: "ouvert" },
    { premier: "19:00", dernier: "20:00", pas: 30, etat: "ouvert" },
  ];
  const groupes = rangerCreneauxParService(dispo("19:00", "21:30"), services);
  assert.deepEqual(groupes.map((g) => ecrireNomService(g.nom, "fr").titre), ["Le soir, 1er service", "Le soir, 2e service"]);
  assert.deepEqual(groupes.map((g) => g.creneaux.map((c) => c.heure)), [["19:00"], ["21:30"]]);
});

test("sans service réglé : les horaires se rangent par moment de la journée, comme avant", () => {
  const groupes = rangerCreneauxParService(dispo("12:00", "12:30", "19:00"), []);
  assert.deepEqual(groupes.map((g) => [g.nom.moment, g.plage, g.creneaux.length]), [["midi", null, 2], ["soir", null, 1]]);
});

test("plan B : 2 horaires de secours au plus, dans l'ordre des touches", () => {
  let r = basculerHoraireSecours([], "20:30");
  r = basculerHoraireSecours(r.secours, "21:00");
  assert.deepEqual(r, { secours: ["20:30", "21:00"], refuse: false });
  assert.deepEqual(basculerHoraireSecours(r.secours, "21:30"), { secours: ["20:30", "21:00"], refuse: true });
  assert.deepEqual(basculerHoraireSecours(r.secours, "20:30"), { secours: ["21:00"], refuse: false });
  assert.equal(ecrireHeuresSecours(["20:30", "21:00"], "fr"), "20h30, puis 21h");
  assert.equal(ecrireHeuresSecours(["20:30"], "fr"), "20h30");
});

test("une relecture retire un plan B parti, et tout le choix si l'horaire principal est parti", () => {
  assert.deepEqual(ajusterChoixHoraires({ principal: "20:00", secours: ["20:30", "21:00"] }, ["20:00", "21:00"]), {
    principal: "20:00", secours: ["21:00"], principalParti: null, secoursPartis: ["20:30"],
  });
  assert.deepEqual(ajusterChoixHoraires({ principal: "20:00", secours: ["20:30"] }, ["20:30"]), {
    principal: null, secours: [], principalParti: "20:00", secoursPartis: [],
  });
});

test("une ancienne API sans « disponibles » ni « services » : chaque horaire est libre, réponse à la main", () => {
  assert.deepEqual(lireCreneauxLus({ creneaux: ["19:00"] }), {
    creneaux: ["19:00"], disponibles: [{ heure: "19:00", peuDePlaces: false }], services: [], acceptation: "manuelle",
  });
});

test("la raison d'un jour sans créneau suit l'état lu, et un jour ouvert sans horaire libre est complet", () => {
  assert.equal(lireRaisonSansCreneau("sans-resa"), "sans-resa");
  assert.equal(lireRaisonSansCreneau("ouvert"), null);
  assert.equal(lireRaisonSansCreneau("ouvert", 0), "complet");
});

test("Mes réservations : une demande montre son 1er choix puis ses secours, une table acceptée son horaire retenu", () => {
  const proposes = [iso("20:00"), iso("20:30"), iso("21:00")];
  const demande = { statut: "demandee", creneau: iso("20:00"), creneauxProposes: proposes, reponduLe: null };
  assert.deepEqual(lireHorairesReservation(demande), { affiche: proposes[0], autres: proposes.slice(1), planB: null });
  const planB = { ...demande, statut: "acceptee", creneau: iso("20:30"), reponduLe: iso("18:00") };
  assert.deepEqual(lireHorairesReservation(planB), { affiche: iso("20:30"), autres: [], planB: { premier: proposes[0] } });
  assert.equal(lireHorairesReservation({ ...planB, creneau: iso("20:00") }).planB, null);
  const ancienne = { statut: "acceptee", creneau: iso("20:00"), creneauxProposes: [], reponduLe: null };
  assert.deepEqual(lireHorairesReservation(ancienne), { affiche: iso("20:00"), autres: [], planB: null });
});
