// Tests des routes de gestion des outils sur les lieux : contrôle, lieux semblables, import CSV (faux services).
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  chercherLieuxSemblables: async (fiche: unknown) => (appels.push({ semblables: fiche }), [{ id: 3, nom: "Le 140", ville: "La Grande-Motte" }]),
  verifierDoublonsImport: async (lignes: { index: number }[]) =>
    new Map(lignes.map(({ index }) => [index, { semblables: index === 0 ? [{ id: 3, nom: "Le 140", ville: "La Grande-Motte" }] : [], dansLeFichier: index === 2 ? [3] : index === 3 ? [2] : [] }])),
  importerLieux: async (fiches: { nom: string; emoji: string; statut: string }[]) => (appels.push({ importer: fiches }), { crees: fiches.length, placees: 1 }),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("lieux semblables : la fiche est lue depuis l'adresse de la demande ; sans nom, rien", async () => {
  assert.deepEqual(await (await banc.demander("GET", "/lieux/semblables?nom=Restaurant%20le%20140&ville=La%20Grande-Motte&latitude=43.56", { session })).json(), [{ id: 3, nom: "Le 140", ville: "La Grande-Motte" }]);
  assert.deepEqual(appels.at(-1), { semblables: { nom: "Restaurant le 140", ville: "La Grande-Motte", adresse: null, latitude: 43.56, longitude: null } });
  assert.deepEqual(await (await banc.demander("GET", "/lieux/semblables?ville=S%C3%A8te", { session })).json(), []);
});

test("aperçu d'un import : chaque ligne valable ou non, avec ses doublons", async () => {
  const lignes = [
    { nom: "Restaurant le 140", ville: "La Grande-Motte" },
    { nom: "Sans ville" },
    { nom: "Pepita", ville: "Montpellier", type: "bar", siteWeb: "https://pepita.fr" },
    { nom: "Pepita", ville: "Montpellier", latitude: 43.6, longitude: 3.88 },
    { nom: "Mauvais site", ville: "Sète", siteWeb: "http://pas-sur.fr" },
  ];
  const reponse = await banc.demander("POST", "/lieux/import/verifier", { session, corps: { lieux: lignes } });
  assert.deepEqual(await reponse.json(), [
    { ok: true, semblables: [{ id: 3, nom: "Le 140", ville: "La Grande-Motte" }], dansLeFichier: [] },
    { ok: false, champ: "ville", semblables: [], dansLeFichier: [] },
    { ok: true, semblables: [], dansLeFichier: [3] },
    { ok: true, semblables: [], dansLeFichier: [2] },
    { ok: false, champ: "siteWeb", semblables: [], dansLeFichier: [] },
  ]);
  assert.equal((await banc.demander("POST", "/lieux/import/verifier", { session, corps: { lieux: [] } })).status, 400);
});

test("import : un paquet de 50 au plus, tout valable sinon rien, en brouillon avec l'emoji du type", async () => {
  const ok = await banc.demander("POST", "/lieux/import", { session, corps: { lieux: [{ nom: "Pepita", ville: "Montpellier", type: "bar", adresse: "3 rue Foch" }] } });
  assert.equal(ok.status, 201);
  assert.deepEqual(await ok.json(), { ok: true, crees: 1, placees: 1 });
  const fiche = (appels.at(-1) as { importer: { nom: string; emoji: string; statut: string; type: string }[] }).importer[0]!;
  assert.deepEqual([fiche.nom, fiche.type, fiche.emoji, fiche.statut], ["Pepita", "bar", "🍹", "brouillon"]);
  assert.equal(journal.at(-1), "Lieux importés (fichier CSV) · 1 fiche(s) en brouillon, 1 placée(s) par l'adresse");
  const invalide = await banc.demander("POST", "/lieux/import", { session, corps: { lieux: [{ nom: "A", ville: "Sète" }, { nom: "B", ville: "Sète", prix: "€€€€" }] } });
  assert.deepEqual(await invalide.json(), { ok: false, erreur: "champ-invalide", champ: "1.prix" });
  assert.equal((await banc.demander("POST", "/lieux/import", { session, corps: { lieux: Array.from({ length: 51 }, () => ({ nom: "X", ville: "Y" })) } })).status, 400);
});
