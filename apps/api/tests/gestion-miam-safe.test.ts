// Tests de Miam Safe dans le logiciel de gestion : une décision qui touche le lieu a toujours sa note ; alertes vues, chartes rendues.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const banc = await creerBancGestion({
  listerMiamSafe: async (vue: string) => (appels.push({ lister: vue }), { vue, compteurs: { aTraiter: 0, enRetard: 0, sansReponse: 0, chartes: 0 }, signalements: [] }),
  deciderSignalementMiamSafe: async (id: number, decision: unknown) =>
    (appels.push({ decider: decision }), id === 1 ? { lieuId: 7, lieu: "Chez Léa" } : id === 2 ? "deja-traite" : null),
  marquerAlerteMiamSafeVue: async (id: number) => id === 1,
  rendreCharteMiamSafe: async (id: number) => id === 7,
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("Miam Safe (gestion) : la liste s'ouvre sur les signalements à traiter", async () => {
  assert.equal((await banc.demander("GET", "/miam-safe", { session })).status, 200);
  assert.deepEqual(appels.at(-1), { lister: "a-traiter" });
  await banc.demander("GET", "/miam-safe?vue=alertes", { session });
  assert.deepEqual(appels.at(-1), { lister: "alertes" });
});

test("Miam Safe (gestion) : agir sur le lieu demande une note ; « rien à faire » non", async () => {
  const decider = (corps: unknown, id = 1) => banc.demander("POST", `/miam-safe/signalements/${id}/decision`, { session, corps });
  assert.equal((await decider({ action: "supprimer-tout" })).status, 400);
  assert.equal((await decider({ action: "charte-retiree", note: "Bof." })).status, 400);
  assert.equal((await decider({ action: "charte-retiree", note: "Deux signalements de harcèlement par un serveur." })).status, 200);
  assert.deepEqual(appels.at(-1), { decider: { action: "charte-retiree", note: "Deux signalements de harcèlement par un serveur." } });
  assert.equal((await decider({ action: "aucune" })).status, 200);
  assert.equal((await decider({ action: "aucune" }, 2)).status, 409);
  assert.equal((await decider({ action: "aucune" }, 3)).status, 404);
});

test("Miam Safe (gestion) : alerte vue, charte rendue", async () => {
  assert.equal((await banc.demander("POST", "/miam-safe/alertes/1/vue", { session })).status, 200);
  assert.equal((await banc.demander("POST", "/miam-safe/alertes/9/vue", { session })).status, 404);
  assert.equal((await banc.demander("POST", "/miam-safe/chartes/7/rendre", { session })).status, 200);
  assert.equal((await banc.demander("POST", "/miam-safe/chartes/8/rendre", { session })).status, 404);
});
