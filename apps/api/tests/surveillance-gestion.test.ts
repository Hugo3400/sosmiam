// Tests des routes de gestion de la surveillance des visites (comptes louches, lieux qui refusent, contestations), avec
// de faux services.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { SEUILS_PAR_DEFAUT } from "../src/services/gestion/seuils-surveillance.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  lireSurveillance: async () => ({ seuils: SEUILS_PAR_DEFAUT, comptes: [], lieux: [], contestations: [] }),
  ecrireSeuilsSurveillance: async (seuils: unknown) => void appels.push({ seuils }),
  marquerSurveilleVu: async (type: string, id: number) => (appels.push({ vu: type, id }), id === 7),
  marquerContestationRelue: async (id: number) => (id === 31 ? { compteId: 7, lieuId: 12 } : null),
} as never, undefined, null, {
  donnerRaisonAuClient: async (visiteId: number) => (
    appels.push({ raison: visiteId }),
    visiteId === 31 ? { ok: true, visiteId, compteId: 7, lieuId: 12 } : visiteId === 33 ? { ok: false, erreur: "transition-interdite" } : { ok: false, erreur: "introuvable" }
  ),
});
const sansVisites = await creerBancGestion({} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => (banc.fermer(), sansVisites.fermer()));

test("lecture de la surveillance", async () => {
  const reponse = await banc.demander("GET", "/surveillance", { session });
  assert.equal(reponse.status, 200);
  assert.deepEqual(((await reponse.json()) as { seuils: unknown }).seuils, SEUILS_PAR_DEFAUT);
});

test("seuils : tous obligatoires, entiers et dans leurs bornes ; noté au journal", async () => {
  const seuils = { ...SEUILS_PAR_DEFAUT, parJour: 6 };
  assert.deepEqual(await (await banc.demander("PUT", "/surveillance/seuils", { session, corps: seuils })).json(), { ok: true, seuils });
  assert.deepEqual(appels.at(-1), { seuils });
  assert.equal(journal.at(-1), "Seuils de surveillance des visites modifiés · plus de 6 visites par jour, 34 % de refus sur 6 visites ; lieux : 34 % sur 10 ; sur 30 jours");
  for (const mauvais of [{ ...seuils, partRefusMin: 101 }, { ...seuils, parJour: 2.5 }, { ...seuils, fenetreJours: undefined }, { ...seuils, decisionsMin: "6" }]) {
    assert.equal((await banc.demander("PUT", "/surveillance/seuils", { session, corps: mauvais })).status, 400);
  }
  assert.deepEqual(appels.at(-1), { seuils }, "rien d'enregistré après un refus");
});

test("vu : compte ou lieu signalé, sinon 404 « pas-signale »", async () => {
  assert.deepEqual(await (await banc.demander("POST", "/surveillance/comptes/7/vu", { session })).json(), { ok: true });
  assert.equal(journal.at(-1), "Compte signalé vu (rien à signaler) · compte n° 7");
  assert.deepEqual(await (await banc.demander("POST", "/surveillance/lieux/8/vu", { session })).json(), { ok: false, erreur: "pas-signale" });
  assert.deepEqual(appels.at(-1), { vu: "lieu", id: 8 });
});

test("contestation relue : le journal garde les numéros, jamais le mot du client", async () => {
  assert.deepEqual(await (await banc.demander("POST", "/surveillance/contestations/31/relue", { session })).json(), { ok: true });
  assert.equal(journal.at(-1), "Contestation de refus relue · visite n° 31, compte n° 7, lieu n° 12");
  assert.equal((await banc.demander("POST", "/surveillance/contestations/32/relue", { session })).status, 404);
});

test("donner raison au client : visite validée par l'App, contestation relue, numéros seulement au journal", async () => {
  assert.deepEqual(await (await banc.demander("POST", "/surveillance/contestations/31/raison", { session })).json(), { ok: true });
  assert.equal(journal.at(-1), "Raison donnée au client (visite validée) · visite n° 31, compte n° 7, lieu n° 12");
  assert.deepEqual(await (await banc.demander("POST", "/surveillance/contestations/33/raison", { session })).json(), { ok: false, erreur: "transition-interdite" });
  assert.equal((await banc.demander("POST", "/surveillance/contestations/34/raison", { session })).status, 404);
  assert.equal(journal.at(-1), "Raison donnée au client (visite validée) · visite n° 31, compte n° 7, lieu n° 12", "rien de noté sur un refus");
  const autre = await sansVisites.ouvrirSession();
  assert.deepEqual(await (await sansVisites.demander("POST", "/surveillance/contestations/31/raison", { session: autre })).json(), { ok: false, erreur: "bientot-disponible" });
});
