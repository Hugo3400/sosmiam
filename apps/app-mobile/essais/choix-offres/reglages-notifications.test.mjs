import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { enregistrerReglagesNotifications, lireReglagesNotifications, REGLAGES_NOTIFICATIONS_PAR_DEFAUT } from "~/stockage/reglages-notifications";

const CLE = "sosmiam.reglages-notifications";

const ANCIENS = {
  actives: true,
  types: { sos: false, calme: true, offre: true, evenement: true, nouveau: true, abonne: true, demande: true, "publication-suivie": true },
  silence: { actif: false, de: "22:00", a: "08:00" },
};

beforeEach(() => {
  globalThis.__magasin = new Map();
  globalThis.__delaiMagasin = 0;
});

test("téléphone neuf : les offres sont éteintes", async () => {
  const lus = await lireReglagesNotifications();
  assert.equal(lus.types.offre, false);
  assert.deepEqual(lus, REGLAGES_NOTIFICATIONS_PAR_DEFAUT);
});

test("ancien « oui » d'avant le 15/10 : les offres repassent à non, le reste est gardé", async () => {
  globalThis.__magasin.set(CLE, JSON.stringify(ANCIENS));
  const lus = await lireReglagesNotifications();
  assert.equal(lus.types.offre, false);
  assert.equal(lus.types.sos, false);
  assert.deepEqual(lus.silence, ANCIENS.silence);
});

test("remise à zéro une seule fois : ensuite, le choix de la personne est respecté", async () => {
  globalThis.__magasin.set(CLE, JSON.stringify(ANCIENS));
  const lus = await lireReglagesNotifications();
  await enregistrerReglagesNotifications({ ...lus, silence: { ...lus.silence, actif: true } });
  assert.equal((await lireReglagesNotifications()).types.offre, false);
  await enregistrerReglagesNotifications({ ...lus, types: { ...lus.types, offre: true } });
  assert.equal((await lireReglagesNotifications()).types.offre, true);
  assert.equal((await lireReglagesNotifications()).types.offre, true);
  await enregistrerReglagesNotifications({ ...lus, types: { ...lus.types, offre: false } });
  assert.equal((await lireReglagesNotifications()).types.offre, false);
});

test("le repère de version est écrit avec les réglages", async () => {
  await enregistrerReglagesNotifications(REGLAGES_NOTIFICATIONS_PAR_DEFAUT);
  assert.equal(JSON.parse(globalThis.__magasin.get(CLE)).version, 2);
});

test("une version inconnue compte comme un ancien réglage", async () => {
  globalThis.__magasin.set(CLE, JSON.stringify({ ...ANCIENS, version: 1 }));
  assert.equal((await lireReglagesNotifications()).types.offre, false);
});
