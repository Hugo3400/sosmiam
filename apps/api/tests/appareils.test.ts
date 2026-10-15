// Les téléphones inscrits aux notifications (PUT/DELETE /app/appareils) : session facultative, jamais de 401, compte pris
// dans la session et jamais dans le corps, téléphone lié à cette session (par l'empreinte de son jeton, jamais le jeton),
// champs vérifiés, un même jeton mis à jour.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import type { InscriptionAppareil } from "../src/services/appareils-push.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";

const banc = { horloge: Date.parse("2026-10-14T10:00:00Z") };
const memoire = creerComptesEnMemoire(() => banc.horloge);
const appareils = new Map<string, InscriptionAppareil>();
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro, horloge: () => banc.horloge },
  appareilsApp: {
    inscrire: async (a) => void appareils.set(a.jeton, a),
    desinscrire: async (jeton) => appareils.delete(jeton),
  },
}).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
beforeEach(() => appareils.clear());

const JETON_APNS = "a".repeat(64);
const JETON_FCM = "dQw4w9WgXcQ:APA91bH-exemple_jeton-FCM_tres-long-0123456789";

async function demander(methode: string, corps: unknown, entetes: Record<string, string> = {}) {
  const r = await fetch(`${adresse}/app/appareils`, {
    method: methode,
    headers: { "Content-Type": "application/json", "X-IP-Visiteur": `v-${Math.random()}`, ...entetes },
    body: JSON.stringify(corps),
  });
  return { statut: r.status, corps: (await r.json()) as Record<string, unknown>, cache: r.headers.get("cache-control") };
}

/** Un compte et une session de l'app ; `inactifDepuis` (ms) : une session du site restée sans visite (expirée après 30 jours) */
async function creerCompte(inactifDepuis?: number) {
  const id = await memoire.services.creerCompte({ email: `tel${Date.now()}${Math.random()}@exemple.fr`, motDePasse: "empreinte", prenom: "Léa", ville: "Montpellier", quartier: null, cguVersion: "2026-10-08", espace: "pro" });
  if (typeof id !== "number") throw new Error("compte de test impossible");
  const jeton = creerJeton();
  const depuis = banc.horloge - (inactifDepuis ?? 0);
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: depuis, activite: depuis, support: inactifDepuis === undefined ? "app" : "site" });
  return { id, jeton };
}

test("sans session : inscrit sans compte, jamais en cache", async () => {
  const r = await demander("PUT", { jeton: JETON_APNS, plateforme: "ios", ville: "  Montpellier  " });
  assert.equal(r.statut, 200);
  assert.equal(r.cache, "private, no-store");
  assert.deepEqual(appareils.get(JETON_APNS), { jeton: JETON_APNS, plateforme: "ios", ville: "Montpellier", offres: false, compteId: null, empreinteSession: null });
});

test("session valable : lié au compte ; le compte du corps est ignoré ; même jeton : mis à jour", async () => {
  const { id, jeton } = await creerCompte();
  await demander("PUT", { jeton: JETON_FCM, plateforme: "android", ville: null });
  const r = await demander("PUT", { jeton: JETON_FCM, plateforme: "android", ville: "Sète", compteId: 999 }, { Authorization: `Bearer ${jeton}` });
  assert.equal(r.statut, 200);
  assert.equal(appareils.size, 1);
  assert.deepEqual(appareils.get(JETON_FCM), { jeton: JETON_FCM, plateforme: "android", ville: "Sète", offres: false, compteId: id, empreinteSession: calculerEmpreinteJeton(jeton) });
});

test("lié à la session qui l'inscrit (Bearer de l'app ou X-Session-Compte), jamais au jeton en clair ; sans session : détaché", async () => {
  const { id, jeton } = await creerCompte();
  await demander("PUT", { jeton: JETON_APNS, plateforme: "ios" }, { "X-Session-Compte": jeton });
  assert.deepEqual(appareils.get(JETON_APNS), { jeton: JETON_APNS, plateforme: "ios", ville: null, offres: false, compteId: id, empreinteSession: calculerEmpreinteJeton(jeton) });
  assert.ok(!JSON.stringify([...appareils.values()]).includes(jeton), "le jeton de session n'est jamais transmis");
  // Une autre session du même compte (un autre téléphone, ou une reconnexion) : le téléphone suit la dernière
  const autre = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(autre), { compteId: id, creeLe: banc.horloge, activite: banc.horloge, support: "app" });
  await demander("PUT", { jeton: JETON_APNS, plateforme: "ios" }, { Authorization: `Bearer ${autre}` });
  assert.equal(appareils.get(JETON_APNS)?.empreinteSession, calculerEmpreinteJeton(autre));
  // Déconnexion (l'app le réinscrit sans session) : ni compte, ni session
  await demander("PUT", { jeton: JETON_APNS, plateforme: "ios" });
  assert.deepEqual(appareils.get(JETON_APNS), { jeton: JETON_APNS, plateforme: "ios", ville: null, offres: false, compteId: null, empreinteSession: null });
});

test("session invalide ou expirée : inscrit sans compte ni session, sans 401", async () => {
  const r = await demander("PUT", { jeton: JETON_APNS, plateforme: "ios" }, { Authorization: `Bearer ${"x".repeat(43)}` });
  assert.equal(r.statut, 200);
  assert.equal(appareils.get(JETON_APNS)?.compteId, null);
  assert.equal(appareils.get(JETON_APNS)?.empreinteSession, null);
  const expiree = await creerCompte(31 * 86_400_000);
  const r2 = await demander("PUT", { jeton: JETON_FCM, plateforme: "android" }, { Authorization: `Bearer ${expiree.jeton}` });
  assert.equal(r2.statut, 200);
  assert.deepEqual(appareils.get(JETON_FCM), { jeton: JETON_FCM, plateforme: "android", ville: null, offres: false, compteId: null, empreinteSession: null });
});

test("offres : vrai seulement quand l'app envoie true ; absent (ancienne version de l'app) : faux", async () => {
  const { id, jeton } = await creerCompte();
  await demander("PUT", { jeton: JETON_APNS, plateforme: "ios", ville: "Lyon", offres: true }, { Authorization: `Bearer ${jeton}` });
  assert.deepEqual(appareils.get(JETON_APNS), { jeton: JETON_APNS, plateforme: "ios", ville: "Lyon", offres: true, compteId: id, empreinteSession: calculerEmpreinteJeton(jeton) });
  await demander("PUT", { jeton: JETON_APNS, plateforme: "ios", ville: "Lyon", offres: false });
  assert.equal(appareils.get(JETON_APNS)?.offres, false);
  await demander("PUT", { jeton: JETON_APNS, plateforme: "ios", offres: true });
  assert.equal(appareils.get(JETON_APNS)?.offres, true);
  const r = await demander("PUT", { jeton: JETON_APNS, plateforme: "ios" });
  assert.equal(r.statut, 200);
  assert.equal(appareils.get(JETON_APNS)?.offres, false);
});

test("champs refusés : jeton, plateforme, ville, offres", async () => {
  for (const [corps, champ] of [
    [{ jeton: "court", plateforme: "ios" }, "jeton"],
    [{ jeton: "a b".repeat(20), plateforme: "ios" }, "jeton"],
    [{ jeton: JETON_APNS, plateforme: "windows" }, "plateforme"],
    [{ jeton: JETON_APNS, plateforme: "ios", ville: 3 }, "ville"],
    [{ jeton: JETON_APNS, plateforme: "ios", ville: "x".repeat(81) }, "ville"],
    [{ jeton: JETON_APNS, plateforme: "ios", offres: "true" }, "offres"],
    [{ jeton: JETON_APNS, plateforme: "ios", offres: 1 }, "offres"],
    [{ jeton: JETON_APNS, plateforme: "ios", offres: null }, "offres"],
    [{ jeton: JETON_APNS, plateforme: "ios", offres: [true] }, "offres"],
    [{ jeton: JETON_APNS, plateforme: "windows", offres: "oui" }, "plateforme"],
  ] as const) {
    const r = await demander("PUT", corps);
    assert.equal(r.statut, 400);
    assert.deepEqual(r.corps, { ok: false, erreur: "champ-invalide", champ });
  }
  assert.equal(appareils.size, 0);
});

test("désinscription : oublié tout de suite ; déjà oublié : réussi quand même ; jeton abîmé : 400", async () => {
  await demander("PUT", { jeton: JETON_APNS, plateforme: "ios" });
  assert.equal((await demander("DELETE", { jeton: JETON_APNS })).statut, 200);
  assert.equal(appareils.size, 0);
  assert.equal((await demander("DELETE", { jeton: JETON_APNS })).statut, 200);
  assert.equal((await demander("DELETE", { jeton: "?" })).statut, 400);
});
