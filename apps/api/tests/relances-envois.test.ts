import assert from "node:assert/strict";
import { test } from "node:test";

import { annoncerRelance, arreterAnnonceRelance, creerRelancesEnvois, DELAIS_RELANCE_MS, estAnnonceDeRelance, type EtatRelance } from "../src/services/courriels/relances-envois.ts";

const temporaire = () => Object.assign(new Error("421 trop de connexions"), { responseCode: 421 });
const definitif = () => Object.assign(new Error("550 adresse inconnue"), { responseCode: 550 });

function creerBanc() {
  const taches: { action: () => void; delai: number; annulee: boolean }[] = [];
  const notes: { id: number; etat: EtatRelance }[] = [];
  const relances = creerRelancesEnvois({
    noter: async (id, etat) => void notes.push({ id, etat }),
    decrire: (erreur) => (erreur as Error).message,
    planifier: (action, delai) => {
      const tache = { action, delai, annulee: false };
      taches.push(tache);
      return { annuler: () => void (tache.annulee = true) };
    },
    horloge: () => Date.UTC(2026, 9, 24, 19, 0),
  });
  const derniere = () => taches.at(-1)!;
  const declencher = async () => {
    const tache = derniere();
    assert.equal(tache.annulee, false);
    tache.action();
    await new Promise((fin) => setImmediate(fin));
  };
  return { relances, taches, notes, derniere, declencher };
}

test("un refus passager : nouvel essai 30 s plus tard, noté parti", async () => {
  const banc = creerBanc();
  let appels = 0;
  banc.relances.programmer({ cle: "verification-email|lea@exemple.fr", id: 7, essai: 1, tenter: async () => void appels++ });
  assert.equal(banc.derniere().delai, 30_000);
  await banc.declencher();
  assert.equal(appels, 1);
  assert.deepEqual(banc.notes, [{ id: 7, etat: { envoye: true, essais: 2, erreur: null } }]);
  assert.equal(banc.relances.compter(), 0);
});

test("toujours refusé : 4 nouveaux essais au plus (30 s, 2 min, 10 min, 30 min), puis abandon", async () => {
  const banc = creerBanc();
  banc.relances.programmer({ cle: "mot-de-passe|lea@exemple.fr", id: 3, essai: 1, tenter: async () => { throw temporaire(); } });
  for (let k = 0; k < DELAIS_RELANCE_MS.length; k++) {
    assert.equal(banc.derniere().delai, DELAIS_RELANCE_MS[k]);
    await banc.declencher();
  }
  assert.equal(banc.taches.length, 4);
  assert.deepEqual(banc.notes.map((n) => n.etat.essais), [2, 3, 4, 5]);
  assert.match(banc.notes[0]!.etat.erreur!, /^421 trop de connexions · nouvel essai à \d{2}:\d{2}$/);
  assert.equal(banc.notes.at(-1)!.etat.erreur, "421 trop de connexions");
  assert.equal(banc.relances.compter(), 0);
});

test("refus définitif (550) au nouvel essai : on s'arrête", async () => {
  const banc = creerBanc();
  banc.relances.programmer({ cle: "verification-email|zoe@exemple.fr", id: 4, essai: 1, tenter: async () => { throw definitif(); } });
  await banc.declencher();
  assert.equal(banc.taches.length, 1);
  assert.deepEqual(banc.notes, [{ id: 4, etat: { envoye: false, essais: 2, erreur: "550 adresse inconnue" } }]);
  assert.equal(banc.relances.compter(), 0);
});

test("un nouveau lien pour la même adresse annule l'ancien essai, même pendant qu'il part", async () => {
  const banc = creerBanc();
  banc.relances.programmer({ cle: "verification-email|lea@exemple.fr", id: 1, essai: 1, tenter: async () => {} });
  banc.relances.annuler("verification-email|lea@exemple.fr");
  assert.equal(banc.taches[0]!.annulee, true);
  assert.equal(banc.relances.compter(), 0);

  let refuser: (erreur: Error) => void = () => {};
  banc.relances.programmer({ cle: "verification-email|lea@exemple.fr", id: 2, essai: 1, tenter: () => new Promise((_, rejeter) => (refuser = rejeter)) });
  banc.derniere().action();
  banc.relances.annuler("verification-email|lea@exemple.fr");
  refuser(temporaire());
  await new Promise((fin) => setImmediate(fin));
  assert.equal(banc.taches.length, 2, "pas de nouvel essai après l'annulation");
  assert.deepEqual(banc.notes, [{ id: 2, etat: { envoye: false, essais: 2, erreur: "421 trop de connexions" } }]);
});

test("journal en panne ou mail sans ligne : le nouvel essai part quand même, sans erreur non rattrapée", async () => {
  const taches: (() => void)[] = [];
  let partis = 0;
  const relances = creerRelancesEnvois({
    noter: async () => { throw new Error("base injoignable"); },
    decrire: (erreur) => (erreur as Error).message,
    planifier: (action) => (taches.push(action), { annuler: () => {} }),
  });
  relances.programmer({ cle: "a", id: 9, essai: 1, tenter: async () => void partis++ });
  relances.programmer({ cle: "b", id: null, essai: 1, tenter: async () => void partis++ });
  const erreurs: unknown[] = [];
  const ecouter = (erreur: unknown) => erreurs.push(erreur);
  process.on("unhandledRejection", ecouter);
  const console_ = console.error;
  console.error = () => {};
  for (const action of taches) action();
  await new Promise((fin) => setTimeout(fin, 10));
  console.error = console_;
  process.off("unhandledRejection", ecouter);
  assert.equal(partis, 2);
  assert.deepEqual(erreurs, []);
});

test("annonce : heure de Paris, message coupé pour tenir dans le journal", () => {
  assert.equal(annoncerRelance("421 occupé", Date.UTC(2026, 9, 24, 19, 30)), "421 occupé · nouvel essai à 21:30");
  assert.equal(annoncerRelance("421 occupé", Date.UTC(2026, 11, 24, 19, 30)), "421 occupé · nouvel essai à 20:30");
  assert.ok(annoncerRelance("x".repeat(500), Date.now()).length <= 300);
  assert.equal(annoncerRelance("x".repeat(500), null).length, 300);
});

test("après un redémarrage, une relance annoncée devient « relances arrêtées »", () => {
  const annonce = annoncerRelance("421 Service indisponible", Date.parse("2026-10-25T09:30:00Z"));
  assert.equal(estAnnonceDeRelance(annonce), true);
  assert.equal(arreterAnnonceRelance(annonce), "421 Service indisponible · relances arrêtées par un redémarrage du serveur");
  assert.equal(estAnnonceDeRelance(arreterAnnonceRelance(annonce)), false);
  assert.equal(estAnnonceDeRelance("550 Adresse inconnue"), false);
  assert.equal(estAnnonceDeRelance(null), false);
});
