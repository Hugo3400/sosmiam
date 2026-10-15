import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";

import { createElement, useEffect } from "react";
import { creerRacine } from "react-dom/client";

import { changer, monde } from "./doublures/monde.mjs";
import { utiliserSuiviAlerteMiamSafe } from "~/hooks/utiliser-suivi-alerte-miam-safe";
import { ecrireCleAlerteMiamSafe, garderAlerteMiamSafe, lireAlerteGardeeMiamSafe, noterStatutAlerteMiamSafe } from "~/services/memoire-alertes-miam-safe";

const MINUTE = 60_000;
const EMAIL = "lea@example.com";
const vraieImmediate = setImmediate;

let lieu = 100;
let racine = null;
let serveur = null;

function creerServeur() {
  const etats = new Map();
  const appels = [];
  const attentes = [];
  return {
    etats,
    appels,
    attentes,
    lent: false,
    panne: null,
    suivreAlerte(id) {
      appels.push(id);
      if (this.panne === "rejet") return Promise.reject(new Error("hors ligne"));
      if (this.panne === "erreur") return Promise.resolve({ ok: false, erreur: "service-indisponible" });
      const etat = etats.get(id) ?? { statut: "envoyee", repondueLe: null };
      const reponse = { ok: true, alerte: { id, statut: etat.statut, creeLe: new Date().toISOString(), repondueLe: etat.repondueLe } };
      if (!this.lent) return Promise.resolve(reponse);
      return new Promise((fin) => attentes.push(() => fin(reponse)));
    },
  };
}

function Sonde({ lieuId, actif }) {
  const etat = utiliserSuiviAlerteMiamSafe(lieuId, actif);
  useEffect(() => {
    monde.etatHook = etat;
  });
  return null;
}

const laisser = async () => {
  for (let i = 0; i < 12; i += 1) await new Promise((fin) => vraieImmediate(fin));
};

async function avancer(ms) {
  for (let fait = 0; fait < ms; fait += 1000) {
    mock.timers.tick(Math.min(1000, ms - fait));
    await laisser();
  }
}

async function montrer(actif) {
  racine.render(createElement(Sonde, { lieuId: lieu, actif }));
  await laisser();
}

const cle = () => ecrireCleAlerteMiamSafe("api", EMAIL, lieu);
const garder = (id, telephones = 2) => garderAlerteMiamSafe(cle(), { id, envoyeeLe: Date.now(), telephones });
const enMemoire = () => lireAlerteGardeeMiamSafe(cle());
const repondre = (id, il = 0) => serveur.etats.set(id, { statut: "en-route", repondueLe: new Date(Date.now() - il).toISOString() });

beforeEach(() => {
  mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"], now: Date.parse("2026-10-15T20:00:00.000Z") });
  lieu += 1;
  serveur = creerServeur();
  changer({ services: { source: "api", miamSafe: serveur }, compte: { email: EMAIL } });
  monde.etatHook = null;
  racine = creerRacine();
});

afterEach(async () => {
  racine?.unmount();
  racine = null;
  await laisser();
  mock.timers.reset();
});

test("feuille fermée : rien n'est relu", async () => {
  garder(1);
  await montrer(false);
  await avancer(10_000);
  assert.deepEqual(serveur.appels, []);
  assert.equal(monde.etatHook.aRelire, false);
  assert.equal(monde.etatHook.alerte.id, 1);
});

test("aucune alerte gardée : rien n'est relu", async () => {
  await montrer(true);
  await avancer(10_000);
  assert.deepEqual(serveur.appels, []);
  assert.equal(monde.etatHook.alerte, null);
  assert.equal(monde.etatHook.aRelire, false);
});

test("à l'ouverture : relue tout de suite, « on regarde » jusqu'à la réponse, puis toutes les 3 s", async () => {
  garder(1);
  serveur.lent = true;
  await montrer(true);
  assert.deepEqual(serveur.appels, [1]);
  assert.equal(monde.etatHook.aRelire, true);
  serveur.attentes.shift()();
  await laisser();
  assert.equal(monde.etatHook.aRelire, false);
  serveur.lent = false;
  await avancer(9_000);
  assert.deepEqual(serveur.appels, [1, 1, 1, 1]);
});

test("le bug corrigé : « On arrive » donné feuille fermée, la réouverture montre « L'équipe arrive »", async () => {
  garder(1);
  await montrer(true);
  await montrer(false);
  await avancer(MINUTE);
  repondre(1);
  const reponduLe = Date.now();
  await avancer(2 * MINUTE);
  assert.equal(enMemoire().statut, "sans-reponse");
  const avant = serveur.appels.length;
  await montrer(true);
  assert.equal(serveur.appels.length, avant + 1);
  assert.equal(enMemoire().statut, "en-route");
  assert.equal(enMemoire().reponduLe, reponduLe);
  assert.equal(monde.etatHook.alerte.statut, "en-route");
  assert.equal(monde.etatHook.aRelire, false);
  await avancer(30_000);
  assert.equal(serveur.appels.length, avant + 1, "plus de relecture une fois « On arrive » reçu");
});

test("« On arrive » pendant que la ligne de suivi est affichée : vu à la relecture suivante", async () => {
  garder(1);
  await montrer(true);
  await avancer(3_000);
  assert.equal(enMemoire().statut, "envoyee");
  repondre(1);
  await avancer(3_000);
  assert.equal(monde.etatHook.alerte.statut, "en-route");
});

test("feuille refermée : les relectures s'arrêtent ; rouverte : « on regarde » revient le temps d'une lecture", async () => {
  garder(1);
  await montrer(true);
  await avancer(6_000);
  assert.equal(serveur.appels.length, 3);
  await montrer(false);
  await avancer(30_000);
  assert.equal(serveur.appels.length, 3);
  assert.equal(monde.etatHook.aRelire, false);
  serveur.lent = true;
  await montrer(true);
  assert.equal(monde.etatHook.aRelire, true);
  serveur.attentes.shift()();
  await laisser();
  assert.equal(monde.etatHook.aRelire, false);
});

test("« sans réponse » : relue toutes les 10 s, et le serveur peut la faire passer « sans réponse » avant le minuteur", async () => {
  garder(1);
  serveur.etats.set(1, { statut: "sans-reponse", repondueLe: null });
  await montrer(true);
  assert.equal(enMemoire().statut, "sans-reponse");
  const avant = serveur.appels.length;
  await avancer(30_000);
  assert.equal(serveur.appels.length - avant, 3);
});

test("« Renvoyer une alerte » : « On arrive » sur la première suffit", async () => {
  garder(1);
  await avancer(3 * MINUTE);
  garder(2);
  repondre(1, 5_000);
  await montrer(true);
  assert.deepEqual(serveur.appels, [2, 1]);
  assert.equal(enMemoire().id, 2);
  assert.equal(enMemoire().statut, "en-route");
  assert.equal(enMemoire().reponduLe, Date.now() - 5_000);
});

test("« Renvoyer une alerte » : une seule requête par tour, la dernière alerte un tour sur deux", async () => {
  garder(1);
  await avancer(3 * MINUTE);
  garder(2);
  await avancer(MINUTE);
  garder(3);
  await montrer(true);
  assert.deepEqual(serveur.appels, [3, 1, 2]);
  await avancer(18_000);
  assert.deepEqual(serveur.appels.slice(3), [3, 1, 3, 2, 3, 1]);
});

test("« Nouvelle alerte » après « L'équipe arrive » : l'ancienne n'est plus relue", async () => {
  garder(1);
  noterStatutAlerteMiamSafe(cle(), 1, "en-route", Date.now());
  await avancer(MINUTE);
  garder(2);
  repondre(1);
  await montrer(true);
  await avancer(6_000);
  assert.ok(serveur.appels.every((id) => id === 2), JSON.stringify(serveur.appels));
  assert.equal(enMemoire().statut, "envoyee");
});

for (const panne of ["rejet", "erreur"]) {
  test(`lecture ratée (${panne}) : rien ne change, « on regarde » s'efface, on réessaie`, async () => {
    garder(1);
    serveur.panne = panne;
    await montrer(true);
    assert.equal(monde.etatHook.aRelire, false);
    assert.equal(enMemoire().statut, "envoyee");
    await avancer(3_000);
    assert.equal(serveur.appels.length, 2);
    serveur.panne = null;
    repondre(1);
    await avancer(3_000);
    assert.equal(enMemoire().statut, "en-route");
  });
}

test("réseau lent : pas de deuxième requête tant que la première n'est pas revenue", async () => {
  garder(1);
  serveur.lent = true;
  await montrer(true);
  await avancer(12_000);
  assert.equal(serveur.appels.length, 1);
  serveur.attentes.shift()();
  await laisser();
  await avancer(3_000);
  assert.equal(serveur.appels.length, 2);
});

test("réponse arrivée après la fermeture : ignorée, relue à la réouverture", async () => {
  garder(1);
  serveur.lent = true;
  await montrer(true);
  await montrer(false);
  repondre(1);
  serveur.attentes.shift()();
  await laisser();
  assert.equal(enMemoire().statut, "envoyee");
  serveur.lent = false;
  await montrer(true);
  assert.equal(enMemoire().statut, "en-route");
});

test("15 minutes : l'alerte est oubliée et plus rien n'est relu", async () => {
  garder(1);
  await montrer(true);
  await avancer(15 * MINUTE);
  assert.equal(monde.etatHook.alerte, null);
  const avant = serveur.appels.length;
  await avancer(30_000);
  assert.equal(serveur.appels.length, avant);
});

test("démontée : plus aucune relecture", async () => {
  garder(1);
  await montrer(true);
  racine.unmount();
  racine = null;
  await laisser();
  const avant = serveur.appels.length;
  await avancer(30_000);
  assert.equal(serveur.appels.length, avant);
});

test("un autre compte sur le même téléphone ne suit pas l'alerte de Léa", async () => {
  garder(1);
  changer({ compte: { email: "tom@example.com" } });
  await montrer(true);
  await avancer(6_000);
  assert.equal(monde.etatHook.alerte, null);
  assert.deepEqual(serveur.appels, []);
});
