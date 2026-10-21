import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { createElement, useEffect } from "react";
import { creerRacine } from "react-dom/client";
import { AppState } from "react-native";

import { changerProfil, monde } from "./doublures/monde.mjs";
import { FournisseurPositionActuelle } from "~/composants/explorer/FournisseurPositionActuelle";
import { utiliserEffacementLocal } from "~/hooks/utiliser-effacement-local";
import { utiliserPositionActuelle } from "~/hooks/utiliser-position-actuelle";

const HUGO = { prenom: "Hugo", dateNaissance: "1995-01-01", ville: "Marseille", envies: {}, creeLe: "2026-09-01T10:00:00.000Z" };
const LEA = { prenom: "Léa", dateNaissance: "1992-04-02", ville: "Lyon", envies: {}, creeLe: "2026-10-02T09:00:00.000Z" };
const ICI = { latitude: 43.2965, longitude: 5.3698 };

const pause = (ms) => new Promise((fin) => setTimeout(fin, ms));
const vraiMaintenant = Date.now.bind(Date);
let avance = 0;
Date.now = () => vraiMaintenant() + avance;
let racine = null;

function Sonde() {
  const position = utiliserPositionActuelle();
  const effacement = utiliserEffacementLocal();
  useEffect(() => {
    monde.position = position;
    monde.effacement = effacement;
  });
  return null;
}

async function monter(profil = HUGO) {
  racine = creerRacine();
  monde.rendre = () => racine.render(createElement(FournisseurPositionActuelle, null, createElement(Sonde)));
  changerProfil(profil);
  await pause(30);
}

async function trouverPosition() {
  const lecture = await monde.position.chercher();
  await pause(30);
  assert.deepEqual(lecture?.position, ICI);
  assert.deepEqual(monde.position.position, ICI);
}

async function absence(minutes) {
  AppState.changerPourEssai("inactive");
  AppState.changerPourEssai("background");
  await pause(10);
  avance += minutes * 60_000;
  AppState.changerPourEssai("active");
  await pause(30);
}

beforeEach(() => {
  Object.assign(monde, { lectures: [], appelsLecture: 0, effacements: [], position: null, effacement: null, attenteEffacement: 0 });
  AppState.currentState = "active";
});

afterEach(async () => {
  monde.rendre = null;
  racine?.unmount();
  racine = null;
  await pause(20);
});

test("se déconnecter ou « Effacer mes données » oublie la position tout de suite, avant même la fin de l'effacement", async () => {
  await monter();
  await trouverPosition();
  monde.attenteEffacement = 40;
  const effacement = monde.effacement.toutEffacer();
  await pause(60);
  assert.equal(monde.effacements.includes("profil"), false, "l'effacement est encore en cours");
  assert.equal(monde.position.position, null, "position encore là pendant l'effacement");
  assert.equal(await effacement, true);
  await pause(30);
  assert.equal(monde.position.position, null);
  assert.ok(monde.effacements.includes("profil"));
});

test("une session perdue ou un autre compte : la position d'avant n'est jamais reprise", async () => {
  await monter();
  await trouverPosition();
  changerProfil(null);
  await pause(30);
  assert.equal(monde.position.position, null, "visite sans compte après la déconnexion");
  changerProfil(HUGO);
  await pause(30);
  assert.equal(monde.position.position, null, "le même compte qui revient ne retrouve rien");
  await trouverPosition();
  changerProfil(LEA);
  await pause(30);
  assert.equal(monde.position.position, null, "un autre compte sur le même téléphone");
});

test("une position qui arrive après la déconnexion n'est pas gardée", async () => {
  await monter();
  monde.lectures.push({ attente: 120, lecture: { position: ICI, approximative: false } });
  const enCours = monde.position.chercher();
  await pause(20);
  await monde.effacement.toutEffacer();
  assert.equal(await enCours, null);
  await pause(30);
  assert.equal(monde.position.position, null);
  assert.equal(monde.position.recherche, false);
});

test("plus de 5 minutes hors de l'app : oubliée, annoncée quelques secondes seulement", async () => {
  await monter();
  await trouverPosition();
  await absence(3);
  assert.deepEqual(monde.position.position, ICI, "3 minutes : toujours là");
  await absence(6);
  assert.equal(monde.position.position, null);
  const oubli = monde.position.oubliApresAbsence;
  assert.ok(typeof oubli === "number" && Math.abs(oubli - Date.now()) < 1_000);
  await pause(8_200);
  assert.equal(monde.position.oubliApresAbsence, null, "l'annonce ne ressort pas des heures après");
  await absence(10);
  assert.equal(monde.position.oubliApresAbsence, null, "rien à oublier : rien à annoncer");
});
