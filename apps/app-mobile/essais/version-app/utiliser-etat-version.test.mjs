import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { createElement, useEffect } from "react";
import { creerRacine } from "react-dom/client";
import { AppState } from "react-native";

import { serveur } from "./doublures/versions-app-serveur.mjs";
import { utiliserEtatVersion } from "~/hooks/utiliser-etat-version";

const pause = (ms) => new Promise((fin) => setTimeout(fin, ms));
const vraiMaintenant = Date.now.bind(Date);
let avance = 0;
Date.now = () => vraiMaintenant() + avance;

const versions = (ios, android) => ({ ios, android });
const reponse = (minimale, derniere) => ({ ok: true, minimale, ...(derniere === undefined ? {} : { derniere }) });
const A_JOUR = reponse(versions("0.0.0", "0.0.0"));

let racine = null;
let etat = null;
let erreursNonAttrapees = [];
const surErreur = (erreur) => erreursNonAttrapees.push(erreur);

function Sonde() {
  const valeur = utiliserEtatVersion();
  useEffect(() => {
    etat = valeur;
  });
  return null;
}

async function lancer(reponses) {
  serveur.appels = 0;
  serveur.reponse = typeof reponses === "function" ? reponses : () => reponses;
  racine = creerRacine();
  racine.render(createElement(Sonde));
  await pause(30);
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
  avance += 24 * 60 * 60_000;
  etat = null;
  erreursNonAttrapees = [];
  AppState.currentState = "active";
  process.on("uncaughtException", surErreur);
  process.on("unhandledRejection", surErreur);
});

afterEach(async () => {
  racine?.unmount();
  racine = null;
  await pause(10);
  process.off("uncaughtException", surErreur);
  process.off("unhandledRejection", surErreur);
  assert.deepEqual(erreursNonAttrapees, []);
});

test("au lancement : une lecture ; aujourd'hui (0.0.0, pas de derniere) : à jour", async () => {
  await lancer(A_JOUR);
  assert.equal(serveur.appels, 1);
  assert.deepEqual(etat, { etat: "a-jour" });
});

test("derniere plus récente pour Android : nouvelle version", async () => {
  await lancer(reponse(versions("0.0.0", "0.0.0"), versions("1.0.0", "1.2.0")));
  assert.deepEqual(etat, { etat: "nouvelle-version", version: "1.2.0" });
});

test("au plus une lecture toutes les 30 min, au lancement et au retour au premier plan", async () => {
  await lancer(A_JOUR);
  await absence(10);
  await absence(19);
  assert.equal(serveur.appels, 1, "29 min : aucune nouvelle lecture");
  await absence(1.5);
  assert.equal(serveur.appels, 2, "30 min passées : une lecture");
  await absence(5);
  assert.equal(serveur.appels, 2);
});

test("obligatoire : reste affiché quand les lectures suivantes ratent", async () => {
  const suite = [reponse(versions("2.0.0", "2.0.0")), "rejette", { ok: false, erreur: "erreur-serveur" }, { ok: true }, { ok: true, minimale: "2.0.0" }, "jette"];
  await lancer((n) => suite[n - 1]);
  assert.deepEqual(etat, { etat: "obligatoire" });
  for (let i = 2; i <= suite.length; i++) {
    await absence(31);
    assert.equal(serveur.appels, i);
    assert.deepEqual(etat, { etat: "obligatoire" }, String(i));
  }
});

test("obligatoire levé seulement par une lecture réussie qui le dit", async () => {
  let minimale = "2.0.0";
  await lancer(() => reponse(versions(minimale, minimale)));
  assert.deepEqual(etat, { etat: "obligatoire" });
  minimale = "0.0.0";
  await absence(31);
  assert.deepEqual(etat, { etat: "a-jour" });
});

test("hors ligne au lancement : rien ne change, nouvel essai au retour suivant (une minute au moins)", async () => {
  await lancer((n) => (n === 1 ? "rejette" : reponse(versions("0.0.0", "0.0.0"), versions("1.1.0", "1.1.0"))));
  assert.deepEqual(etat, { etat: "a-jour" });
  await absence(0.5);
  assert.equal(serveur.appels, 1, "30 s : trop tôt");
  await absence(1);
  assert.equal(serveur.appels, 2);
  assert.deepEqual(etat, { etat: "nouvelle-version", version: "1.1.0" });
});

test("trop de demandes : attend le temps demandé par le serveur", async () => {
  await lancer((n) => (n === 1 ? { ok: false, erreur: "trop-de-demandes", details: { attenteS: 300 } } : A_JOUR));
  await absence(2);
  assert.equal(serveur.appels, 1);
  await absence(3.5);
  assert.equal(serveur.appels, 2);
});

test("une lecture déjà en route : pas de deuxième demande", async () => {
  let finir = null;
  await lancer(() => new Promise((fin) => (finir = fin)));
  avance += 31 * 60_000;
  await absence(31);
  assert.equal(serveur.appels, 1);
  finir(A_JOUR);
  await pause(20);
  assert.deepEqual(etat, { etat: "a-jour" });
});
