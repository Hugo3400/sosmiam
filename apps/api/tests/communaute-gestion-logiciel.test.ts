import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
const ok = { ok: true, notifications: [] };
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  listerIdeesGestion: async (o: unknown) => (appels.push({ lister: o }), []),
  changerStatutIdee: async (id: number, statut: string) => (appels.push({ id, statut }), id === 9 ? { ok: false, erreur: "introuvable" } : ok),
  repondreIdee: async (id: number, texte: string | null) => (appels.push({ id, texte }), ok),
  choisirIdeeDuMois: async (id: number, mois: string) => (appels.push({ id, mois }), ok),
  masquerCommentaireIdee: async (id: number, masque: boolean) => (appels.push({ id, masque }), ok),
  retirerEtiquetteLibre: async (sortieId: number, nom: string) => (appels.push({ sortieId, nom }), ok),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("idées : filtre de statut connu seulement, statut, réponse et idée du mois vérifiés ; journal sans texte", async () => {
  await banc.demander("GET", "/communaute/idees?statut=prevue", { session });
  await banc.demander("GET", "/communaute/idees?statut=piano", { session });
  assert.deepEqual(appels.splice(0), [{ lister: { statut: "prevue" } }, { lister: { statut: undefined } }]);
  assert.equal((await banc.demander("POST", "/communaute/idees/3/statut", { session, corps: { statut: "banane" } })).status, 400);
  assert.equal((await banc.demander("POST", "/communaute/idees/3/statut", { session, corps: { statut: "a-l-etude" } })).status, 200);
  assert.equal(journal.at(-1), "Statut d'une idée changé · idée n° 3 → a-l-etude");
  assert.equal((await banc.demander("POST", "/communaute/idees/9/statut", { session, corps: { statut: "faite" } })).status, 404);
  assert.equal((await banc.demander("POST", "/communaute/idees/3/reponse", { session, corps: { texte: "Bonne idée, on s'y met !" } })).status, 200);
  assert.ok(!journal.at(-1)!.includes("Bonne idée"));
  assert.equal((await banc.demander("POST", "/communaute/idees/3/idee-du-mois", { session, corps: { mois: "2026-13" } })).status, 400);
  assert.equal((await banc.demander("POST", "/communaute/idees/3/idee-du-mois", { session, corps: { mois: "2026-10" } })).status, 200);
});

test("commentaires et étiquettes : booléen et sortie obligatoires", async () => {
  assert.equal((await banc.demander("POST", "/communaute/commentaires/4/masque", { session, corps: { masque: "oui" } })).status, 400);
  assert.equal((await banc.demander("POST", "/communaute/commentaires/4/masque", { session, corps: { masque: true } })).status, 200);
  assert.equal((await banc.demander("POST", "/communaute/etiquettes/retrait", { session, corps: { nom: "apéro" } })).status, 400);
  assert.equal((await banc.demander("POST", "/communaute/etiquettes/retrait", { session, corps: { sortieId: 7, nom: "apéro" } })).status, 200);
  assert.equal(journal.at(-1), "Étiquette libre retirée · sortie des Miamis n° 7");
});
