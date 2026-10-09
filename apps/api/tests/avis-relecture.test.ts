// Tests de la relecture des avis : pourquoi un avis part en relecture (sans jamais être masqué), et ce qu'un ambassadeur
// relit (/app/avis/a-relire, /app/avis/:id/relecture) : jamais l'auteur, jamais un 15-17 ans, verdicts consultatifs.
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { creerBancAvis } from "./outils/creer-banc-avis.ts";

let b: Awaited<ReturnType<typeof creerBancAvis>>;
before(async () => { b = await creerBancAvis(); });
after(() => b.fermer());
beforeEach(() => b.vider());

const HEURE = 3600_000;

/** Un compte qui donne son avis sur une visite validée au lieu 1, 2 h après */
async function avisVerifie(o: { note?: number; neuf?: boolean; naissance?: string; prenom?: string } = {}) {
  const compte = await b.creerCompte({ prenom: o.prenom ?? "Léa", nom: "Martin", neuf: o.neuf, naissance: o.naissance });
  const visite = b.creerVisite(compte.id, 1, { valideLe: b.banc.horloge - 2 * HEURE });
  const r = await b.demander("POST", "/app/avis", compte.jeton, { visiteId: visite, note: o.note ?? 4, texte: "Une belle table, des assiettes généreuses.", photo: null });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  return { compte, avisId: r.corps.avis.id as number };
}

const ligne = (id: number) => b.donnees.avis.find((a) => a.id === id)!;

test("relecture : compte de moins de 7 jours, rafale de notes tranchées, tirage au sort ; jamais masqué", async () => {
  const calme = await avisVerifie();
  assert.deepEqual([ligne(calme.avisId).statut, ligne(calme.avisId).raisonRelecture], ["publie", null]);
  assert.deepEqual(b.tirages, [20]);

  const neuf = await avisVerifie({ neuf: true });
  assert.deepEqual([ligne(neuf.avisId).statut, ligne(neuf.avisId).raisonRelecture], ["en-relecture", "compte-neuf"]);

  b.banc.tirage = 0;
  const tire = await avisVerifie();
  assert.equal(ligne(tire.avisId).raisonRelecture, "tirage");
  b.banc.tirage = 7;

  // Trois notes tranchées (1 ou 5) sur le même lieu en 24 h : la troisième part en relecture
  const raisons = [];
  for (const note of [5, 1, 5]) raisons.push(ligne((await avisVerifie({ note })).avisId).raisonRelecture);
  assert.deepEqual(raisons, [null, null, "rafale-notes"]);
  // Le lendemain, la rafale est passée
  b.banc.horloge += 25 * HEURE;
  assert.equal(ligne((await avisVerifie({ note: 5 })).avisId).raisonRelecture, null);

  // En relecture, l'avis reste visible et compte dans la moyenne
  const publics = (await b.demander("GET", "/app/avis/lieux/1")).corps;
  assert.equal(publics.resume.nombre, 7);
  assert.ok(publics.avis.some((a: { id: number }) => a.id === neuf.avisId));
  assert.equal("statut" in publics.avis[0] || "raison" in publics.avis[0], false);
});

test("ambassadeur : jamais l'auteur ni son âge, jamais un 15-17 ans, jamais le sien ni un lieu lié", async () => {
  const ambassadeur = await b.creerCompte({ prenom: "Hugo", ambassadeur: true });
  const lie = await b.creerCompte({ prenom: "Sam", ambassadeur: true, lies: [2] });
  const adulte = await avisVerifie({ neuf: true });
  const ado = await avisVerifie({ neuf: true, prenom: "Inès", naissance: "2010-03-01" });
  const publie = await avisVerifie();
  // Son propre avis (non vérifié, au lieu 2), et un avis d'un lieu masqué
  b.banc.tirage = 0;
  const sien = await b.demander("POST", "/app/avis/non-verifie", ambassadeur.jeton, { lieuId: 2, note: 4, texte: "Les crêpes au caramel, une folie.", photo: null });
  b.banc.tirage = 7;
  const autre = await b.ajouterAvis({ lieuId: 2, statut: "en-relecture", raisonRelecture: "tirage" });
  await b.ajouterAvis({ lieuId: 4, statut: "en-relecture", raisonRelecture: "tirage" });

  const liste = await b.demander("GET", "/app/avis/a-relire", ambassadeur.jeton);
  assert.equal(liste.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual(liste.corps.avis, [
    { id: adulte.avisId, lieu: { id: 1, nom: "Chez Léa", emoji: "🍝", type: "resto", ville: "Montpellier" }, note: 4, texte: "Une belle table, des assiettes généreuses.", photo: null, preuve: "comptoir", mois: "2026-10", raison: "compte-neuf" },
    { id: autre.id, lieu: { id: 2, nom: "La Crêpe du Port", emoji: "🥞", type: "resto", ville: "Sète" }, note: 4, texte: "Très bonne adresse, on reviendra.", photo: null, preuve: null, mois: "2026-10", raison: "tirage" },
  ]);
  assert.equal(JSON.stringify(liste.corps).includes("Martin") || JSON.stringify(liste.corps).includes("Léa M."), false);
  // Rattaché au lieu 2 (ou qui demande à l'être) : il ne relit rien de ce lieu
  const ids = (await b.demander("GET", "/app/avis/a-relire", lie.jeton)).corps.avis.map((a: { id: number }) => a.id);
  assert.deepEqual(ids, [adulte.avisId]);
  // Jamais relus : l'avis d'un 15-17 ans, un avis publié sans relecture, le sien, un lieu lié
  for (const [jeton, id] of [[ambassadeur.jeton, ado.avisId], [ambassadeur.jeton, publie.avisId], [ambassadeur.jeton, sien.corps.avis.id], [lie.jeton, autre.id]] as const) {
    const r = await b.demander("POST", `/app/avis/${id}/relecture`, jeton, { verdict: { type: "ok" } });
    assert.deepEqual([r.statut, r.corps.erreur], [404, "introuvable"], String(id));
  }
});

test("verdicts : ok, louche avec motif, déporté ; un par ambassadeur ; 3 verdicts et l'avis quitte la liste", async () => {
  const ambassadeurs = await Promise.all(["Hugo", "Sam", "Nora", "Yanis"].map((prenom) => b.creerCompte({ prenom, ambassadeur: true })));
  const { avisId } = await avisVerifie({ neuf: true });
  const relire = (i: number, verdict: unknown) => b.demander("POST", `/app/avis/${avisId}/relecture`, ambassadeurs[i]!.jeton, { verdict });

  for (const verdict of [undefined, { type: "louche" }, { type: "louche", motif: "il est méchant" }, { type: "masquer" }, "ok"]) {
    const r = await relire(0, verdict);
    assert.deepEqual([r.statut, r.corps.champ], [400, "verdict"], JSON.stringify(verdict));
  }
  assert.deepEqual((await relire(0, { type: "ok" })).statut, 201);
  const encore = await relire(0, { type: "louche", motif: "faux-avis" });
  assert.deepEqual([encore.statut, encore.corps.erreur], [409, "deja-relu"]);
  assert.equal((await b.demander("GET", "/app/avis/a-relire", ambassadeurs[0]!.jeton)).corps.avis.length, 0);
  // Se déporter ne compte pas parmi les 3 verdicts
  assert.equal((await relire(1, { type: "deporte" })).statut, 201);
  assert.equal((await relire(2, { type: "louche", motif: "faux-avis" })).statut, 201);
  assert.equal((await b.demander("GET", "/app/avis/a-relire", ambassadeurs[3]!.jeton)).corps.avis.length, 1);
  assert.equal((await relire(3, { type: "louche", motif: "attaque" })).statut, 201);
  assert.deepEqual(b.donnees.relectures.map((r) => [r.verdict, r.motif]), [["ok", null], ["deporte", null], ["louche", "faux-avis"], ["louche", "attaque"]]);
  // Consultatif : l'avis reste en relecture, visible
  assert.equal(ligne(avisId).statut, "en-relecture");
  const cinquieme = await b.creerCompte({ prenom: "Lina", ambassadeur: true });
  assert.deepEqual((await b.demander("GET", "/app/avis/a-relire", cinquieme.jeton)).corps.avis, []);
});

test("relecture : seulement pour un ambassadeur actif", async () => {
  const lea = await b.creerCompte();
  const { avisId } = await avisVerifie({ neuf: true });
  const liste = await b.demander("GET", "/app/avis/a-relire", lea.jeton);
  assert.deepEqual([liste.statut, liste.corps.erreur], [403, "ambassadeur-non-actif"]);
  assert.equal((await b.demander("POST", `/app/avis/${avisId}/relecture`, lea.jeton, { verdict: { type: "ok" } })).statut, 403);
  assert.equal((await b.demander("GET", "/app/avis/a-relire")).statut, 401);
});
