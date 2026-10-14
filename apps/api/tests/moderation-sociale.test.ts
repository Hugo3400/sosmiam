// Tests des routes de modération des contenus sociaux (logiciel de gestion), avec de faux services : filtre par cible,
// média signalé (lu noté au journal, sans contenu), décision avec la modération sociale passée au service.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  listerSignalements: async (statut: string, social: unknown, cible: string) => (appels.push({ statut, cible, social: social === undefined ? "absente" : "là" }), { compteurs: {}, signalements: [], lieux: {} }),
  lireMediaSignale: async (id: number) => (id === 4 ? { etat: "lu", octets: Buffer.from("OGG"), type: "audio/ogg" } : id === 5 ? { etat: "sans-cle" } : null),
  deciderSignalement: async (id: number, decision: { decision: string }) => (appels.push({ decider: id, decision: decision.decision }), { cible: "message", cibleId: "9", regles: 2, reexamen: false }),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("file : filtre par cible connue seulement", async () => {
  await banc.demander("GET", "/moderation?statut=a-traiter&cible=message", { session });
  assert.deepEqual(appels.at(-1), { statut: "a-traiter", cible: "message", social: "absente" });
  await banc.demander("GET", "/moderation?statut=a-traiter&cible=piano", { session });
  assert.deepEqual(appels.at(-1), { statut: "a-traiter", cible: "", social: "absente" });
});

test("média signalé : servi sans cache, lu noté au journal sans contenu ; sans clé 503 ; absent 404", async () => {
  const reponse = await banc.demander("GET", "/moderation/4/media", { session });
  assert.equal(reponse.status, 200);
  assert.equal(reponse.headers.get("content-type"), "audio/ogg");
  assert.equal(reponse.headers.get("cache-control"), "no-store");
  assert.equal(await reponse.text(), "OGG");
  assert.equal(journal.at(-1), "Média signalé lu · signalement n° 4");
  assert.equal((await banc.demander("GET", "/moderation/5/media", { session })).status, 503);
  assert.equal((await banc.demander("GET", "/moderation/6/media", { session })).status, 404);
});

test("décision sur un message : réglée pour tous les signalements du même contenu", async () => {
  const reponse = await banc.demander("POST", "/moderation/3/decision", { session, corps: { decision: "retenu", motif: "haine", motivation: "Propos insultants, retirés." } });
  assert.deepEqual(await reponse.json(), { ok: true, cible: "message", cibleId: "9", regles: 2, reexamen: false });
  assert.equal(journal.at(-1), "Signalement retenu (contenu retiré) · message n° 9, 2 signalement(s) réglé(s), motif « haine »");
});
