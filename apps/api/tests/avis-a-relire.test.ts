// Test de la file « Avis à relire » du logiciel de gestion (lecture seule) : avis ou réponses, page bornée.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const banc = await creerBancGestion({
  listerAvisARelire: async (options: unknown) => (appels.push(options), { compteurs: { avis: 0, reponses: 0 }, parPage: 20, avis: [], reponses: [] }),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("GET /avis/a-relire : avis par défaut, réponses sur demande, page bornée", async () => {
  assert.equal((await banc.demander("GET", "/avis/a-relire", { session })).status, 200);
  assert.equal((await banc.demander("GET", "/avis/a-relire?quoi=reponses&page=3", { session })).status, 200);
  assert.equal((await banc.demander("GET", "/avis/a-relire?quoi=piano&page=-4", { session })).status, 200);
  assert.deepEqual(appels, [{ quoi: "avis", page: 1 }, { quoi: "reponses", page: 3 }, { quoi: "avis", page: 1 }]);
});
