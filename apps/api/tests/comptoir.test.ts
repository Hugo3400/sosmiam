// Tests du comptoir de l'équipe (/pro/comptoir) et de la fidélité côté client (/app/fidelite).
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { creerBancVisites, SUR_PLACE } from "./outils/creer-banc-visites.ts";

let b: Awaited<ReturnType<typeof creerBancVisites>>;
before(async () => { b = await creerBancVisites(); });
after(() => b.fermer());
beforeEach(() => b.vider());

const PROGRAMME = { actif: true, visitesRequises: 3, recompense: "Un verre de muscat", alcool: true, recompenseSansAlcool: "Une citronnade maison" };

async function equipe() {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1, "gerant");
  const serveur = await b.creerCompte({ prenom: "Nina" });
  b.rattacher(serveur.id, 1, "equipe");
  return { gerant, serveur };
}

/** Une addition demandée par ce compte au lieu 1 */
async function addition(jeton: string) {
  const r = await b.demander("POST", "/app/visites/addition", jeton, { lieuId: 1, position: SUR_PLACE });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  return r.corps.visite as { id: number; code: string };
}

test("l'écran du comptoir : additions avec prénom, initiale et emoji, jamais plus ; lieux de l'équipe", async () => {
  const { gerant, serveur } = await equipe();
  const lea = await b.creerCompte({ prenom: "Léa", nom: "Martin", avatar: "🐙", naissance: "1998-05-02" });
  const v = await addition(lea.jeton);
  const etat = (await b.demander("GET", "/pro/comptoir/lieux/1", serveur.jeton)).corps.etat;
  assert.deepEqual([etat.lieu.nom, etat.validationActive, etat.codePublic, etat.qr], ["Chez Léa", true, "chezlea2", null]);
  assert.deepEqual(etat.demandes, [{ id: v.id, type: "addition", code: v.code, prenom: "Léa", initialeNom: "M", avatar: "🐙", depuis: "2026-10-09T10:00:00.000Z", recompense: null, tamponsIci: 0 }]);
  assert.deepEqual((await b.demander("GET", "/pro/comptoir/lieux", gerant.jeton)).corps.lieux, [{ id: 1, nom: "Chez Léa", emoji: "🍝", role: "gerant" }]);
  assert.deepEqual((await b.demander("GET", "/pro/comptoir/lieux", lea.jeton)).corps.lieux, []);
});

test("rôles : pas de l'équipe, mineur, ou équipe qui règle le programme → role-requis", async () => {
  const { serveur } = await equipe();
  const inconnu = await b.creerCompte();
  const ado = await b.creerCompte({ naissance: "2010-03-01" });
  b.rattacher(ado.id, 1, "equipe");
  for (const jeton of [inconnu.jeton, ado.jeton]) {
    const r = await b.demander("GET", "/pro/comptoir/lieux/1", jeton);
    assert.deepEqual([r.statut, r.corps.erreur], [403, "role-requis"]);
  }
  assert.deepEqual((await b.demander("GET", "/pro/comptoir/lieux", ado.jeton)).corps.lieux, []);
  const lea = await b.creerCompte();
  const v = await addition(lea.jeton);
  assert.equal((await b.demander("POST", `/pro/comptoir/visites/${v.id}/reglee`, inconnu.jeton, {})).corps.erreur, "role-requis");
  assert.equal((await b.demander("POST", "/pro/comptoir/visites/999/reglee", serveur.jeton, {})).statut, 404);
  const programme = await b.demander("PUT", "/pro/comptoir/lieux/1/programme", serveur.jeton, PROGRAMME);
  assert.deepEqual([programme.statut, programme.corps.erreur], [403, "role-requis"]);
});

test("addition réglée : +15, tampon, avis ; dès 2 en attente, le code est obligatoire", async () => {
  const { serveur } = await equipe();
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const vLea = await addition(lea.jeton);
  const vSam = await addition(sam.jeton);
  const sansCode = await b.demander("POST", `/pro/comptoir/visites/${vLea.id}/reglee`, serveur.jeton, {});
  assert.deepEqual([sansCode.statut, sansCode.corps.erreur], [409, "code-faux"]);
  const regle = await b.demander("POST", `/pro/comptoir/visites/${vLea.id}/reglee`, serveur.jeton, { code: vLea.code, reglement: { type: "reduction", reductionPourcent: 20 } });
  assert.equal(regle.statut, 200, JSON.stringify(regle.corps));
  assert.deepEqual(regle.corps.etat.demandes.map((d: { id: number }) => d.id), [vSam.id]);
  assert.equal(regle.corps.etat.validees[0].reglement.reductionPourcent, 20);
  // Une seule en attente : plus besoin de code
  assert.equal((await b.demander("POST", `/pro/comptoir/visites/${vSam.id}/reglee`, serveur.jeton, {})).statut, 200);
  assert.deepEqual(b.points.map((p) => [p.compteId, p.valeur]), [[lea.id, 15], [sam.id, 15]]);
  const vue = (await b.demander("GET", `/app/visites/${vLea.id}`, lea.jeton)).corps.visite;
  assert.deepEqual([vue.statut, vue.points, vue.code, vue.avis.ouvertLe], ["validee", 15, null, "2026-10-09T11:00:00.000Z"]);
  // Validée par le membre de l'équipe qui a touché « Réglée »
  assert.equal(b.visites.visites.find((v) => v.id === vLea.id)?.decideParId, serveur.id);
  assert.equal((await b.demander("POST", `/pro/comptoir/visites/${vLea.id}/reglee`, serveur.jeton, {})).corps.erreur, "transition-interdite");
});

test("refus et annulation par le lieu : motifs fermés, 15 minutes pour annuler, points rendus", async () => {
  const { gerant } = await equipe();
  const lea = await b.creerCompte();
  const v1 = await addition(lea.jeton);
  assert.equal((await b.demander("POST", `/pro/comptoir/visites/${v1.id}/refuser`, gerant.jeton, { motif: "pas content" })).corps.champ, "motif");
  assert.equal((await b.demander("POST", `/pro/comptoir/visites/${v1.id}/refuser`, gerant.jeton, { motif: "introuvable" })).statut, 200);
  const v2 = await addition(lea.jeton);
  await b.demander("POST", `/pro/comptoir/visites/${v2.id}/reglee`, gerant.jeton, {});
  b.banc.horloge += 10 * 60_000;
  const annulee = await b.demander("POST", `/pro/comptoir/visites/${v2.id}/annuler`, gerant.jeton, { motif: "doublon" });
  assert.equal(annulee.statut, 200);
  assert.deepEqual(b.points.map((p) => p.valeur), [15, -15]);
  const vue = (await b.demander("GET", `/app/visites/${v2.id}`, lea.jeton)).corps.visite;
  assert.deepEqual([vue.statut, vue.motifRefus, vue.points, vue.avis], ["retiree", "doublon", 0, null]);
  const v3 = await addition(lea.jeton);
  await b.demander("POST", `/pro/comptoir/visites/${v3.id}/reglee`, gerant.jeton, {});
  b.banc.horloge += 16 * 60_000;
  const tard = await b.demander("POST", `/pro/comptoir/visites/${v3.id}/annuler`, gerant.jeton, { motif: "doublon" });
  assert.deepEqual([tard.statut, tard.corps.erreur], [409, "delai-depasse"]);
});

test("programme et fidélité : 3 visites, récompense figée selon l'âge, demandée puis offerte au comptoir", async () => {
  const { gerant, serveur } = await equipe();
  const programme = await b.demander("PUT", "/pro/comptoir/lieux/1/programme", gerant.jeton, { ...PROGRAMME, recompenseSansAlcool: null });
  assert.deepEqual([programme.statut, programme.corps.champ], [400, "recompenseSansAlcool"]);
  const ok = await b.demander("PUT", "/pro/comptoir/lieux/1/programme", gerant.jeton, PROGRAMME);
  assert.deepEqual([ok.statut, ok.corps.programme.visitesRequises, ok.corps.programme.alcool], [200, 3, true]);
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/1/programme", serveur.jeton)).corps.programme.recompense, "Un verre de muscat");

  const lea = await b.creerCompte();
  const ado = await b.creerCompte({ prenom: "Tom", naissance: "2010-03-01" });
  for (const client of [lea, ado]) {
    for (let i = 0; i < 3; i++) {
      const v = await addition(client.jeton);
      assert.equal((await b.demander("POST", `/pro/comptoir/visites/${v.id}/reglee`, serveur.jeton, {})).statut, 200);
      b.banc.horloge += 60_000;
    }
  }
  const [carteLea] = (await b.demander("GET", "/app/fidelite/cartes", lea.jeton)).corps.cartes;
  assert.deepEqual([carteLea.tampons, carteLea.sur, carteLea.pretes.length, carteLea.pretes[0].libelle, carteLea.pretes[0].alcool], [0, 3, 1, "Un verre de muscat", true]);
  const [carteAdo] = (await b.demander("GET", "/app/fidelite/cartes", ado.jeton)).corps.cartes;
  // Un 15-17 ans ne voit jamais la version avec alcool, ni qu'elle existe
  assert.deepEqual([carteAdo.recompense, carteAdo.recompenseAlcool, carteAdo.pretes[0].libelle, carteAdo.pretes[0].alcool], ["Une citronnade maison", false, "Une citronnade maison", undefined]);

  const demande = await b.demander("POST", "/app/fidelite/cartes/1/demande", lea.jeton);
  const { code, id, expireLe } = demande.corps.carte.demande;
  assert.deepEqual([demande.statut, code.length, Date.parse(expireLe) - b.banc.horloge], [200, 4, 15 * 60_000]);
  assert.equal((await b.demander("POST", "/app/fidelite/cartes/1/demande", lea.jeton)).corps.carte.demande.code, code);
  const etat = (await b.demander("GET", "/pro/comptoir/lieux/1", serveur.jeton)).corps.etat;
  assert.deepEqual(etat.demandes.map((d: { type: string; recompense: string }) => [d.type, d.recompense]), [["recompense", "Un verre de muscat"]]);
  const offerte = await b.demander("POST", `/pro/comptoir/recompenses/${id}/offrir`, serveur.jeton);
  assert.deepEqual([offerte.statut, offerte.corps.etat.demandes], [200, []]);
  const apres = (await b.demander("GET", "/app/fidelite/cartes", lea.jeton)).corps.cartes[0];
  assert.deepEqual([apres.pretes, apres.demande], [[], null]);
  assert.equal((await b.demander("POST", "/app/fidelite/cartes/1/demande", lea.jeton)).corps.erreur, "pas-de-recompense");

  // Une demande trop vieille ne s'offre plus
  const tom = await b.demander("POST", "/app/fidelite/cartes/1/demande", ado.jeton);
  b.banc.horloge += 16 * 60_000;
  const tard = await b.demander("POST", `/pro/comptoir/recompenses/${tom.corps.carte.demande.id}/offrir`, serveur.jeton);
  assert.deepEqual([tard.statut, tard.corps.erreur], [409, "delai-depasse"]);
  // Annuler sa demande
  const reprise = await b.demander("POST", "/app/fidelite/cartes/1/demande", ado.jeton);
  assert.ok(reprise.corps.carte.demande);
  assert.equal((await b.demander("DELETE", "/app/fidelite/cartes/1/demande", ado.jeton)).corps.carte.demande, null);
});

test("QR montré : 1 à 12 personnes, règlement de la liste fermée, lieu qui valide", async () => {
  const { serveur } = await equipe();
  for (const personnes of [0, 13, 2.5, "2"]) {
    assert.equal((await b.demander("POST", "/pro/comptoir/lieux/1/qr", serveur.jeton, { personnes })).corps.champ, "personnes", String(personnes));
  }
  assert.equal((await b.demander("POST", "/pro/comptoir/lieux/1/qr", serveur.jeton, { reglement: { type: "gratuit" } })).corps.erreur, "reglement-invalide");
  const r = await b.demander("POST", "/pro/comptoir/lieux/1/qr", serveur.jeton, { personnes: 4 });
  assert.deepEqual([r.corps.etat.qr.personnes, r.corps.etat.qr.restantes, r.corps.etat.qr.finitLe], [4, 4, "2026-10-09T10:02:00.000Z"]);
  assert.match(r.corps.etat.qr.texte, /^https:\/\/sosmiam\.fr\/v\/1\.[0-9a-z]+\.[0-9a-z]+\.[0-9a-z]+\.[A-Za-z0-9_-]{22}$/);
  b.visites.lieux.get(1)!.validationActive = false;
  assert.equal((await b.demander("POST", "/pro/comptoir/lieux/1/qr", serveur.jeton, {})).corps.erreur, "lieu-sans-validation");
});
