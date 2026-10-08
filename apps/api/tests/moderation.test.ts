// Tests de la modération (logiciel de gestion) : un contenu retiré a toujours sa règle et son pourquoi ; contestation
// et réexamen.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const banc = await creerBancGestion({
  deciderSignalement: async (id: number, decision: unknown) =>
    (appels.push({ decider: decision }), id === 1 ? { cible: "publication", cibleId: "4", regles: 2, reexamen: false } : id === 2 ? "deja-decide" : null),
  contesterSignalement: async (id: number, texte: string) => (appels.push({ contester: texte }), id === 1),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("retirer un contenu : la règle enfreinte et l'explication pour l'auteur sont obligatoires", async () => {
  const decider = (corps: unknown, id = 1) => banc.demander("POST", `/moderation/${id}/decision`, { session, corps });
  assert.equal((await decider({ decision: "retenu" })).status, 400);
  assert.equal((await decider({ decision: "retenu", motif: "pas-une-regle", motivation: "Des insultes visant une serveuse." })).status, 400);
  assert.equal((await decider({ decision: "retenu", motif: "haine", motivation: "Bof." })).status, 400);
  assert.equal((await decider({ decision: "retenu", motif: "haine", motivation: "Des insultes visant une serveuse.", note: "2e fois" })).status, 200);
  assert.deepEqual(appels.at(-1), { decider: { decision: "retenu", note: "2e fois", motif: "haine", motivation: "Des insultes visant une serveuse." } });
  assert.equal((await decider({ decision: "rejete" })).status, 200, "rien à redire : pas de motif");
  assert.deepEqual(appels.at(-1), { decider: { decision: "rejete", note: null, motif: null, motivation: null } });
  assert.equal((await decider({ decision: "rejete" }, 2)).status, 409, "déjà décidé et pas contesté");
  assert.equal((await decider({ decision: "rejete" }, 3)).status, 404);
});

test("contestation : un texte, seulement sur une décision déjà prise", async () => {
  assert.equal((await banc.demander("POST", "/moderation/1/contestation", { session, corps: {} })).status, 400);
  assert.equal((await banc.demander("POST", "/moderation/1/contestation", { session, corps: { contestation: "C'était de l'humour entre amis." } })).status, 200);
  assert.equal((await banc.demander("POST", "/moderation/5/contestation", { session, corps: { contestation: "Je conteste." } })).status, 409);
});
