// Tests des routes de gestion des rattachements pro ↔ lieu (« Lieu vérifié ✓ »), avec de faux services.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  listerRattachements: async (filtres: unknown) => (appels.push({ liste: filtres }), []),
  deciderRattachement: async (id: number, decision: string, reponse: string | null) => (
    appels.push({ decider: id, decision, reponse }),
    id === 4 ? { statut: decision === "valider" ? "valide" : decision === "refuser" ? "refuse" : "retire", compteId: 7, lieuId: 12, nomLieu: "La Fournée" } : null
  ),
  envoyerCourrielEcrit: async (destinataire: unknown, objet: string, texte: string) => (appels.push({ mail: destinataire, objet, texte }), { ok: true }),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("liste : statut, rôle et lieu passés au service", async () => {
  await banc.demander("GET", "/rattachements?statut=en-attente&role=gerant&lieu=12", { session });
  assert.deepEqual(appels.at(-1), { liste: { statut: "en-attente", role: "gerant", lieuId: 12 } });
});

test("décision : valider avec un mail, refuser sans, retirer ; mauvaise décision ou introuvable", async () => {
  const valider = await banc.demander("POST", "/rattachements/4/decision", { session, corps: { decision: "valider", reponse: "Bienvenue chez les pros !", envoyer: true } });
  assert.deepEqual(await valider.json(), { ok: true, statut: "valide", mail: "envoye" });
  assert.deepEqual(appels.at(-1), { mail: { compteId: 7 }, objet: "C'est validé : ton lieu est vérifié ✓ (La Fournée)", texte: "Bienvenue chez les pros !" });
  assert.equal(journal.at(-1), "Rattachement pro valide · rattachement n° 4, lieu n° 12, compte n° 7");
  assert.deepEqual(await (await banc.demander("POST", "/rattachements/4/decision", { session, corps: { decision: "refuser" } })).json(), { ok: true, statut: "refuse", mail: "aucun" });
  assert.equal((await banc.demander("POST", "/rattachements/4/decision", { session, corps: { decision: "supprimer" } })).status, 400);
  assert.equal((await banc.demander("POST", "/rattachements/9/decision", { session, corps: { decision: "retirer" } })).status, 404);
});
