// Tests des avis au comptoir (/pro/comptoir/lieux/:id/avis, /pro/comptoir/avis/:avisId/reponse) : l'équipe lit les avis de
// son lieu, seul le gérant répond, une fois, en public, publié tout de suite.
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { creerBancAvis } from "./outils/creer-banc-avis.ts";

let b: Awaited<ReturnType<typeof creerBancAvis>>;
before(async () => { b = await creerBancAvis(); });
after(() => b.fermer());
beforeEach(() => b.vider());

async function equipe() {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1, "gerant");
  const serveur = await b.creerCompte({ prenom: "Nina" });
  b.rattacher(serveur.id, 1, "equipe");
  return { gerant, serveur };
}

const REPONSE = "Merci Léa ! Le tiramisu vous attend, et la prochaine fois la terrasse sera chauffée.";

test("le gérant répond une fois, en public, publié tout de suite ; l'équipe ne répond pas", async () => {
  const { gerant, serveur } = await equipe();
  const avis = await b.ajouterAvis({ lieuId: 1, note: 3 });
  const refus = await b.demander("POST", `/pro/comptoir/avis/${avis.id}/reponse`, serveur.jeton, { texte: REPONSE });
  assert.deepEqual([refus.statut, refus.corps.erreur], [403, "role-requis"]);

  b.banc.horloge = Date.parse("2026-11-02T09:00:00Z");
  const r = await b.demander("POST", `/pro/comptoir/avis/${avis.id}/reponse`, gerant.jeton, { texte: `  ${REPONSE} ` });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.equal(r.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual(r.corps.avis.reponseLieu, { texte: REPONSE, mois: "2026-11" });
  assert.deepEqual([b.donnees.avis[0]!.reponseStatut, b.donnees.avis[0]!.reponseParId], ["publiee", gerant.id]);
  const publics = (await b.demander("GET", "/app/avis/lieux/1")).corps.avis;
  assert.deepEqual(publics[0].reponseLieu, { texte: REPONSE, mois: "2026-11" });

  const encore = await b.demander("POST", `/pro/comptoir/avis/${avis.id}/reponse`, gerant.jeton, { texte: "Et encore merci !" });
  assert.deepEqual([encore.statut, encore.corps.erreur], [409, "reponse-deja-donnee"]);
  // Masquée par l'équipe SOS Miam : elle disparaît, et ne se remplace pas
  b.donnees.avis[0]!.reponseStatut = "masquee";
  assert.equal((await b.demander("GET", "/app/avis/lieux/1")).corps.avis[0].reponseLieu, null);
});

test("réponse refusée : texte vide, trop long ou grossier, avis inconnu, d'un autre lieu ou masqué", async () => {
  const { gerant } = await equipe();
  const avis = await b.ajouterAvis({ lieuId: 1 });
  for (const texte of ["   ", "x".repeat(601), "Espèce de connard.", 42]) {
    const r = await b.demander("POST", `/pro/comptoir/avis/${avis.id}/reponse`, gerant.jeton, { texte });
    assert.deepEqual([r.statut, r.corps.erreur, r.corps.champ], [400, "message-refuse", "texte"], String(texte));
  }
  const inconnu = await b.demander("POST", "/pro/comptoir/avis/999/reponse", gerant.jeton, { texte: REPONSE });
  assert.deepEqual([inconnu.statut, inconnu.corps.erreur], [404, "introuvable"]);
  const ailleurs = await b.ajouterAvis({ lieuId: 2 });
  assert.equal((await b.demander("POST", `/pro/comptoir/avis/${ailleurs.id}/reponse`, gerant.jeton, { texte: REPONSE })).corps.erreur, "role-requis");
  const masque = await b.ajouterAvis({ lieuId: 1, statut: "masque" });
  assert.equal((await b.demander("POST", `/pro/comptoir/avis/${masque.id}/reponse`, gerant.jeton, { texte: REPONSE })).statut, 404);
  assert.equal((await b.demander("POST", `/pro/comptoir/avis/abc/reponse`, gerant.jeton, { texte: REPONSE })).corps.champ, "avisId");
  assert.equal((await b.demander("POST", `/pro/comptoir/avis/${avis.id}/reponse`, undefined, { texte: REPONSE })).statut, 401);
});

test("la liste du comptoir : gérant et équipe, avis visibles avec leur réponse, résumé, pagination", async () => {
  const { gerant, serveur } = await equipe();
  const intrus = await b.creerCompte({ prenom: "Zoé" });
  for (let i = 1; i <= 31; i++) await b.ajouterAvis({ lieuId: 1, note: 4 });
  await b.ajouterAvis({ lieuId: 1, note: 1, statut: "masque" });
  const dernier = await b.ajouterAvis({ lieuId: 1, note: 2, statut: "en-relecture", raisonRelecture: "compte-neuf" });
  await b.demander("POST", `/pro/comptoir/avis/${dernier.id}/reponse`, gerant.jeton, { texte: REPONSE });

  const r = await b.demander("GET", "/pro/comptoir/lieux/1/avis", serveur.jeton);
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.equal(r.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual([r.corps.avis.length, r.corps.avis[0].id, r.corps.avis[0].reponseLieu.texte], [30, dernier.id, REPONSE]);
  assert.deepEqual(r.corps.resume, { moyenne: 3.9, nombre: 32, partRetour: null });
  const suite = await b.demander("GET", `/pro/comptoir/lieux/1/avis?apres=${r.corps.suite}`, gerant.jeton);
  assert.deepEqual([suite.corps.avis.length, suite.corps.suite], [2, null]);
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/1/avis", intrus.jeton)).corps.erreur, "role-requis");
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/2/avis", gerant.jeton)).statut, 403);
});
