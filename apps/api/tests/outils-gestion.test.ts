// Tests des routes « outils » du logiciel de gestion : alertes, recherche, calendrier, bilan, réponses types.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const banc = await creerBancGestion({
  rechercherPartout: async (q: string) => (appels.push({ recherche: q }), { lieux: [] }),
  lireCalendrier: async (debut: Date, fin: Date) => (appels.push({ calendrier: [debut, fin] }), []),
  lireBilanMois: async (mois: string) => (appels.push({ bilan: mois }), { mois }),
  creerReponseType: async (saisie: unknown) => (appels.push({ creer: saisie }), { id: 1 }),
  modifierReponseType: async (id: number) => (id === 1 ? { id } : null),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("recherche : le texte est transmis tel quel, coupé à 100 caractères", async () => {
  await banc.demander("GET", "/recherche?q=Chez%20Lia", { session });
  assert.deepEqual(appels.at(-1), { recherche: "Chez Lia" });
  await banc.demander("GET", `/recherche?q=${"a".repeat(150)}`, { session });
  assert.equal((appels.at(-1) as { recherche: string }).recherche.length, 100);
});

test("calendrier : deux dates valables, 62 jours au plus", async () => {
  assert.equal((await banc.demander("GET", "/calendrier?debut=2026-10-01&fin=2026-11-01", { session })).status, 200);
  assert.equal((await banc.demander("GET", "/calendrier?debut=nimporte&fin=2026-11-01", { session })).status, 400);
  assert.equal((await banc.demander("GET", "/calendrier?debut=2026-10-01&fin=2026-09-01", { session })).status, 400);
  assert.equal((await banc.demander("GET", "/calendrier?debut=2026-01-01&fin=2026-12-31", { session })).status, 400);
});

test("bilan : un mois « AAAA-MM »", async () => {
  assert.equal((await banc.demander("GET", "/statistiques/bilan?mois=2026-10", { session })).status, 200);
  assert.deepEqual(appels.at(-1), { bilan: "2026-10" });
  assert.equal((await banc.demander("GET", "/statistiques/bilan?mois=2026-13", { session })).status, 400);
  assert.equal((await banc.demander("GET", "/statistiques/bilan", { session })).status, 400);
});

test("réponses types : titre, catégorie connue et texte obligatoires", async () => {
  const modele = { titre: "Merci", categorie: "createur", objet: "Merci 💛", texte: "Salut {prenom} !" };
  assert.equal((await banc.demander("POST", "/reponses-types", { session, corps: { ...modele, categorie: "spam" } })).status, 400);
  assert.equal((await banc.demander("POST", "/reponses-types", { session, corps: { ...modele, texte: "" } })).status, 400);
  assert.equal((await banc.demander("POST", "/reponses-types", { session, corps: modele })).status, 201);
  assert.deepEqual(appels.at(-1), { creer: modele });
  assert.equal((await banc.demander("PUT", "/reponses-types/2", { session, corps: modele })).status, 404);
});
