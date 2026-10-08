// Tests des BIG SOS : la phase se déduit des dates, et les routes du logiciel contrôlent ce qu'elles reçoivent.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { calculerPhaseBigSos } from "../src/fonctions/big-sos/calculer-phase-big-sos.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

test("phase : programmé, à la une 7 jours, puis à clôturer ; les autres statuts tels quels", () => {
  const debutLe = new Date("2026-10-10T08:00:00Z");
  const finLe = new Date("2026-10-17T08:00:00Z");
  const valide = { statut: "valide", debutLe, finLe };
  assert.equal(calculerPhaseBigSos(valide, new Date("2026-10-09T12:00:00Z")), "programme");
  assert.equal(calculerPhaseBigSos(valide, new Date("2026-10-12T12:00:00Z")), "a-la-une");
  assert.equal(calculerPhaseBigSos(valide, new Date("2026-10-18T12:00:00Z")), "a-cloturer");
  assert.equal(calculerPhaseBigSos({ statut: "verification", debutLe: null, finLe: null }), "verification");
});

const appels: unknown[] = [];
const banc = await creerBancGestion({
  creerBigSos: async (saisie: { lieuId: number }) => (appels.push({ creer: saisie }), saisie.lieuId === 3 ? { id: 1 } : null),
  modifierBigSos: async (id: number, modification: unknown) => (appels.push({ modifier: modification }), id === 1 ? { id } : null),
  envoyerVerification: async (id: number, compteId: number) => (id !== 1 ? null : compteId === 7 ? { missionId: 9 } : { erreur: "ambassadeur-non-actif" }),
  deciderBigSos: async (id: number, choix: unknown) => (appels.push({ decider: choix }), id === 1),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("création : un lieu qui existe et une histoire", async () => {
  assert.equal((await banc.demander("POST", "/big-sos", { session, corps: { lieuId: 3 } })).status, 400);
  assert.equal((await banc.demander("POST", "/big-sos", { session, corps: { lieuId: 4, histoire: "Les travaux de la rue ont fait fuir tout le monde." } })).status, 404);
  assert.equal((await banc.demander("POST", "/big-sos", { session, corps: { lieuId: 3, histoire: "Les travaux de la rue ont fait fuir tout le monde." } })).status, 201);
});

test("modification : objectif et liens (https seulement, 10 au plus)", async () => {
  const lien = (adresse: string) => ({ session, corps: { liens: [{ titre: "La vidéo de Léa", adresse }] } });
  assert.equal((await banc.demander("PUT", "/big-sos/1", lien("javascript:alert(1)"))).status, 400);
  assert.equal((await banc.demander("PUT", "/big-sos/1", lien("http://tiktok.com/x"))).status, 400);
  assert.equal((await banc.demander("PUT", "/big-sos/1", lien("https://www.tiktok.com/@lea/video/1"))).status, 200);
  assert.equal((await banc.demander("PUT", "/big-sos/1", { session, corps: { objectifTitre: "Visites", objectifCible: 300, objectifAtteint: 12 } })).status, 200);
  assert.deepEqual(appels.at(-1), { modifier: { objectifTitre: "Visites", objectifCible: 300, objectifAtteint: 12 } });
  assert.equal((await banc.demander("PUT", "/big-sos/2", { session, corps: { note: "x" } })).status, 404);
});

test("vérification et décisions : étape impossible = 409, une date pour valider, un bilan pour clôturer", async () => {
  assert.equal((await banc.demander("POST", "/big-sos/1/verification", { session, corps: { compteId: 8 } })).status, 400);
  assert.deepEqual(await (await banc.demander("POST", "/big-sos/1/verification", { session, corps: { compteId: 7 } })).json(), { ok: true, missionId: 9 });
  assert.equal((await banc.demander("POST", "/big-sos/2/verification", { session, corps: { compteId: 7 } })).status, 409);
  assert.equal((await banc.demander("POST", "/big-sos/1/decision", { session, corps: { decision: "valider" } })).status, 400);
  assert.equal((await banc.demander("POST", "/big-sos/1/decision", { session, corps: { decision: "valider", debutLe: "2026-10-12T08:00:00.000Z" } })).status, 200);
  const { decider } = appels.at(-1) as { decider: { decision: string; debutLe: Date } };
  assert.equal(decider.decision, "valider");
  assert.equal(decider.debutLe.toISOString(), "2026-10-12T08:00:00.000Z");
  assert.equal((await banc.demander("POST", "/big-sos/1/decision", { session, corps: { decision: "terminer" } })).status, 400);
  assert.equal((await banc.demander("POST", "/big-sos/2/decision", { session, corps: { decision: "vote" } })).status, 409);
});
