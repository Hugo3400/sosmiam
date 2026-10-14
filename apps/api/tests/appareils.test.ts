// Les téléphones inscrits aux notifications (PUT/DELETE /app/appareils) : session facultative, jamais de 401, compte pris
// dans la session et jamais dans le corps, champs vérifiés, un même jeton mis à jour.
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

async function creerCompte() {
  const id = await memoire.services.creerCompte({ email: `tel${Date.now()}${Math.random()}@exemple.fr`, motDePasse: "empreinte", prenom: "Léa", ville: "Montpellier", quartier: null, cguVersion: "2026-10-08", espace: "pro" });
  if (typeof id !== "number") throw new Error("compte de test impossible");
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: banc.horloge, activite: banc.horloge });
  return { id, jeton };
}

test("sans session : inscrit sans compte, jamais en cache", async () => {
  const r = await demander("PUT", { jeton: JETON_APNS, plateforme: "ios", ville: "  Montpellier  " });
  assert.equal(r.statut, 200);
  assert.equal(r.cache, "private, no-store");
  assert.deepEqual(appareils.get(JETON_APNS), { jeton: JETON_APNS, plateforme: "ios", ville: "Montpellier", compteId: null });
});

test("session valable : lié au compte ; le compte du corps est ignoré ; même jeton : mis à jour", async () => {
  const { id, jeton } = await creerCompte();
  await demander("PUT", { jeton: JETON_FCM, plateforme: "android", ville: null });
  const r = await demander("PUT", { jeton: JETON_FCM, plateforme: "android", ville: "Sète", compteId: 999 }, { Authorization: `Bearer ${jeton}` });
  assert.equal(r.statut, 200);
  assert.equal(appareils.size, 1);
  assert.deepEqual(appareils.get(JETON_FCM), { jeton: JETON_FCM, plateforme: "android", ville: "Sète", compteId: id });
});

test("session invalide ou expirée : inscrit sans compte, sans 401", async () => {
  const r = await demander("PUT", { jeton: JETON_APNS, plateforme: "ios" }, { Authorization: `Bearer ${"x".repeat(43)}` });
  assert.equal(r.statut, 200);
  assert.equal(appareils.get(JETON_APNS)?.compteId, null);
});

test("champs refusés : jeton, plateforme, ville", async () => {
  for (const [corps, champ] of [
    [{ jeton: "court", plateforme: "ios" }, "jeton"],
    [{ jeton: "a b".repeat(20), plateforme: "ios" }, "jeton"],
    [{ jeton: JETON_APNS, plateforme: "windows" }, "plateforme"],
    [{ jeton: JETON_APNS, plateforme: "ios", ville: 3 }, "ville"],
    [{ jeton: JETON_APNS, plateforme: "ios", ville: "x".repeat(81) }, "ville"],
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
