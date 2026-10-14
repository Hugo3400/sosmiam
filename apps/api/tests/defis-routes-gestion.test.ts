// Tests des routes /api-gestion/defis (logiciel de gestion), branchées sur le double en mémoire des défis de la session App.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerDefisEnMemoire } from "../src/services/defis-en-memoire.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const journal: string[] = [];
const memoire = creerDefisEnMemoire({ ajouterPoints: async () => {}, donnerBadge: async () => {} });
const banc = await creerBancGestion(
  { noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`) } as never,
  undefined, null, undefined, memoire.services,
);
const sansDefis = await creerBancGestion({} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => (banc.fermer(), sansDefis.fermer()));

const defi = {
  emoji: "🧁", titre: "Tournée des pâtisseries", texte: "Valide 3 visites en pâtisserie ce mois-ci.", mesure: "visites", filtres: { typesLieu: ["patisserie"] },
  objectif: 3, points: 30, debut: "2026-10-01", fin: "2026-10-31", publie: false, ordre: 1,
};

test("créer, lister, modifier, supprimer ; le journal garde le numéro et le titre", async () => {
  const cree = await banc.demander("POST", "/defis", { session, corps: defi });
  assert.equal(cree.status, 201);
  const { defi: garde } = (await cree.json()) as { defi: { id: number; reussites?: number } };
  assert.equal(journal.at(-1), `Défi créé (brouillon) · défi n° ${garde.id} : Tournée des pâtisseries`);
  const liste = (await (await banc.demander("GET", "/defis", { session })).json()) as { id: number; reussites: number }[];
  assert.equal(liste.find((d) => d.id === garde.id)?.reussites, 0);
  const modifie = await banc.demander("PUT", `/defis/${garde.id}`, { session, corps: { publie: true, objectif: 4 } });
  assert.equal(((await modifie.json()) as { defi: { objectif: number; publie: boolean } }).defi.objectif, 4);
  assert.equal(journal.at(-1), `Défi modifié · défi n° ${garde.id} : Tournée des pâtisseries`);
  assert.deepEqual(await (await banc.demander("DELETE", `/defis/${garde.id}`, { session })).json(), { ok: true });
  assert.equal(journal.at(-1), `Défi supprimé · défi n° ${garde.id}`);
});

test("statuts : champ invalide 400 (avec le champ), défi inconnu 404, sans service 503", async () => {
  const invalide = await banc.demander("POST", "/defis", { session, corps: { ...defi, titre: "" } });
  assert.equal(invalide.status, 400);
  assert.deepEqual(await invalide.json(), { ok: false, erreur: "champ-invalide", champ: "titre" });
  assert.equal((await banc.demander("PUT", "/defis/9999", { session, corps: { titre: "Autre" } })).status, 404);
  assert.equal((await banc.demander("DELETE", "/defis/9999", { session })).status, 404);
  const autre = await sansDefis.ouvrirSession();
  assert.equal((await sansDefis.demander("GET", "/defis", { session: autre })).status, 503);
});

test("défi déjà réussi : la règle et la suppression répondent 409, le titre reste modifiable", async () => {
  const { defi: garde } = (await (await banc.demander("POST", "/defis", { session, corps: { ...defi, publie: true } })).json()) as { defi: { id: number } };
  memoire.reussites.push({ defiId: garde.id, points: 30, reussiLe: new Date(), compteId: 7 });
  assert.deepEqual(await (await banc.demander("PUT", `/defis/${garde.id}`, { session, corps: { objectif: 5 } })).json(), { ok: false, erreur: "defi-deja-reussi" });
  assert.equal((await banc.demander("DELETE", `/defis/${garde.id}`, { session })).status, 409);
  assert.equal((await banc.demander("PUT", `/defis/${garde.id}`, { session, corps: { titre: "Tournée sucrée", publie: false } })).status, 200);
});
