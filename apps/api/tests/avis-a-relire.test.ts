// Tests de la relecture des avis dans le logiciel de gestion : la file (avis ou réponses, page bornée), et la décision
// (motif et motivation obligatoires pour masquer, 409 déjà tranché, 503 sans le service de la session App, journal sans texte).
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
const services = {
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  listerAvisARelire: async (options: unknown) => (appels.push(options), { compteurs: { avis: 0, reponses: 0 }, parPage: 20, avis: [], reponses: [] }),
  deciderAvis: async (_avis: unknown, cible: string, id: number, decision: { action: string }) => {
    appels.push({ cible, id, decision });
    if (id === 7) return { ok: false, erreur: "deja-tranche", statut: "masque" };
    if (id === 8) return { ok: false, erreur: "introuvable" };
    return { ok: true, avisId: id, compteId: 3, lieuId: 12, statut: "masque", pointsRetires: 0 };
  },
};
const banc = await creerBancGestion(services as never, undefined, null, undefined, undefined, {} as never);
const sansService = await creerBancGestion(services as never);
let session = "";
let sessionSans = "";
before(async () => void ([session, sessionSans] = await Promise.all([banc.ouvrirSession(), sansService.ouvrirSession()])));
after(() => Promise.all([banc.fermer(), sansService.fermer()]));

test("GET /avis/a-relire : avis par défaut, réponses sur demande, page bornée", async () => {
  assert.equal((await banc.demander("GET", "/avis/a-relire", { session })).status, 200);
  assert.equal((await banc.demander("GET", "/avis/a-relire?quoi=reponses&page=3", { session })).status, 200);
  assert.equal((await banc.demander("GET", "/avis/a-relire?quoi=piano&page=-4", { session })).status, 200);
  assert.deepEqual(appels, [{ quoi: "avis", page: 1 }, { quoi: "reponses", page: 3 }, { quoi: "avis", page: 1 }]);
});

test("décision : masquer exige motif et motivation ; journal sans texte ; 409, 404, 503", async () => {
  appels.length = 0;
  const masquer = { action: "masquer", motif: "haine", motivation: "Insulte envers un serveur, nommé." };
  assert.equal((await banc.demander("POST", "/avis/5/decision", { session, corps: { action: "masquer", motif: "haine" } })).status, 400);
  assert.equal((await banc.demander("POST", "/avis/5/decision", { session, corps: { action: "masquer", motif: "piano", motivation: "Assez long pour passer." } })).status, 400);
  assert.equal((await banc.demander("POST", "/avis/5/decision", { session, corps: masquer })).status, 200);
  assert.equal(journal.at(-1), "Avis masqué · avis n° 5, lieu n° 12, motif « haine »");
  assert.equal((await banc.demander("POST", "/avis/6/reponse/decision", { session, corps: { action: "publier", motif: "haine" } })).status, 200);
  assert.equal(journal.at(-1), "Réponse d'un lieu à un avis publiée · avis n° 6, lieu n° 12");
  const deja = await banc.demander("POST", "/avis/7/decision", { session, corps: masquer });
  assert.deepEqual([deja.status, await deja.json()], [409, { ok: false, erreur: "deja-tranche", statut: "masque" }]);
  assert.equal((await banc.demander("POST", "/avis/8/decision", { session, corps: masquer })).status, 404);
  assert.equal((await sansService.demander("POST", "/avis/5/decision", { session: sessionSans, corps: masquer })).status, 503);
  assert.deepEqual(appels, [
    { cible: "avis", id: 5, decision: masquer },
    { cible: "reponse-avis", id: 6, decision: { action: "publier" } },
    { cible: "avis", id: 7, decision: masquer },
    { cible: "avis", id: 8, decision: masquer },
  ]);
});
