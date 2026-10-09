// Tests de « Mon équipe » (espace pro) : inviter un employé qui a déjà un compte, qui accepte lui-même ; compte inconnu ;
// liste ; retrait ; réservé au gérant ; limites anti-abus. Tout en mémoire : aucune base.
import assert from "node:assert/strict";
import { after, test } from "node:test";

import { ESSAIS_INVITATION_PAR_JOUR, MESSAGE_COMPTE_INCONNU } from "../src/controleurs/pro-equipe.ts";
import { LIMITE_INVITATIONS } from "../src/routes/pro.ts";
import { INVITATIONS_PAR_JOUR, MEMBRES_EQUIPE_MAX } from "../src/services/pro-regles.ts";
import { creerBancPro } from "./outils/creer-banc-pro.ts";

const { banc, memoire, demander, creerCompte, creerGerant, fermer } = await creerBancPro();
after(fermer);
const inviter = (jeton: string, lieuId: number, email: unknown, ip?: string) => demander("POST", `/pro/lieux/${lieuId}/equipe`, { jeton, corps: { email }, ip });

test("inviter → l'employé voit l'invitation, l'accepte, et la fiche s'ouvre à lui", async () => {
  const gerant = await creerGerant();
  const employe = await creerCompte("Max");
  const invitation = await inviter(gerant.jeton, gerant.lieuId, `  ${employe.email.toUpperCase()} `);
  assert.deepEqual([invitation.statut, invitation.corps], [201, { ok: true }]);
  const garde = memoire.rattachements.find((r) => r.compteId === employe.id);
  assert.deepEqual([garde?.role, garde?.statut, garde?.preuve], ["equipe", "en-attente", `Invitation du gérant (compte ${gerant.id})`]);
  // Ce n'est pas l'équipe SOS Miam qui valide une invitation
  assert.equal(memoire.deciderRattachement(garde?.id ?? 0, "valide"), false);

  const siennes = await demander("GET", "/comptes/moi/rattachements", { jeton: employe.jeton });
  assert.deepEqual([siennes.corps.rattachements[0].role, siennes.corps.rattachements[0].statut], ["equipe", "en-attente"]);
  // Le gérant ne peut pas accepter à sa place, ni lui accepter une demande « gerant »
  assert.equal((await demander("POST", `/comptes/moi/rattachements/${garde?.id}/accepter`, { jeton: gerant.jeton })).statut, 404);
  const accepte = await demander("POST", `/comptes/moi/rattachements/${garde?.id}/accepter`, { jeton: employe.jeton });
  assert.deepEqual([accepte.statut, accepte.corps], [200, { ok: true }]);
  assert.equal(garde?.decideLe, banc.horloge);
  const deuxFois = await demander("POST", `/comptes/moi/rattachements/${garde?.id}/accepter`, { jeton: employe.jeton });
  assert.deepEqual([deuxFois.statut, deuxFois.corps], [404, { ok: false, erreur: "invitation-inconnue" }]);
  assert.deepEqual((await demander("GET", "/comptes/session", { jeton: employe.jeton })).corps.compte.pro.lieux[0].statut, "valide");
  assert.equal((await demander("GET", `/pro/lieux/${gerant.lieuId}`, { jeton: employe.jeton })).statut, 200);
});

test("liste de l'équipe : gérant d'abord, e-mail des membres seulement", async () => {
  const gerant = await creerGerant();
  const employe = await creerCompte("Max");
  await inviter(gerant.jeton, gerant.lieuId, employe.email);
  const { statut, corps } = await demander("GET", `/pro/lieux/${gerant.lieuId}/equipe`, { jeton: gerant.jeton });
  assert.equal(statut, 200);
  const moment = new Date(banc.horloge).toISOString();
  assert.deepEqual(corps.equipe, [
    { compteId: gerant.id, prenom: "Gérant", email: null, role: "gerant", statut: "valide", creeLe: moment, decideLe: moment },
    { compteId: employe.id, prenom: "Max", email: employe.email, role: "equipe", statut: "en-attente", creeLe: moment, decideLe: null },
  ]);
});

test("compte inconnu : 404 avec un message neutre ; e-mail mal formé : 400 ; déjà membre : 409", async () => {
  const gerant = await creerGerant();
  const inconnu = await inviter(gerant.jeton, gerant.lieuId, "personne@exemple.fr");
  assert.deepEqual([inconnu.statut, inconnu.corps], [404, { ok: false, erreur: "compte-inconnu", message: MESSAGE_COMPTE_INCONNU }]);
  const mauvais = await inviter(gerant.jeton, gerant.lieuId, "pas-un-email");
  assert.deepEqual([mauvais.statut, mauvais.corps], [400, { ok: false, erreur: "champ-invalide", champ: "email" }]);
  assert.deepEqual((await inviter(gerant.jeton, gerant.lieuId, gerant.email)).corps, { ok: false, erreur: "deja-membre" }, "le gérant lui-même");
  const employe = await creerCompte();
  await inviter(gerant.jeton, gerant.lieuId, employe.email);
  assert.deepEqual((await inviter(gerant.jeton, gerant.lieuId, employe.email)).corps, { ok: false, erreur: "deja-membre" });
});

test("retirer un membre : il perd l'accès tout de suite ; on peut le réinviter ; un gérant ne se retire pas ici", async () => {
  const gerant = await creerGerant();
  const employe = await creerCompte();
  await inviter(gerant.jeton, gerant.lieuId, employe.email);
  const id = memoire.rattachements.find((r) => r.compteId === employe.id)?.id;
  await demander("POST", `/comptes/moi/rattachements/${id}/accepter`, { jeton: employe.jeton });
  const retrait = await demander("DELETE", `/pro/lieux/${gerant.lieuId}/equipe/${employe.id}`, { jeton: gerant.jeton });
  assert.deepEqual([retrait.statut, retrait.corps], [200, { ok: true }]);
  assert.equal((await demander("GET", `/pro/lieux/${gerant.lieuId}`, { jeton: employe.jeton })).statut, 403);
  assert.deepEqual((await demander("GET", "/comptes/session", { jeton: employe.jeton })).corps.compte.pro, { lieux: [] });
  for (const cible of [employe.id, gerant.id, 99_999, "abc"]) {
    const { statut, corps } = await demander("DELETE", `/pro/lieux/${gerant.lieuId}/equipe/${cible}`, { jeton: gerant.jeton });
    assert.deepEqual([statut, corps], [404, { ok: false, erreur: "membre-inconnu" }], String(cible));
  }
  assert.equal((await inviter(gerant.jeton, gerant.lieuId, employe.email)).statut, 201, "réinvité");
  assert.equal(memoire.rattachements.filter((r) => r.compteId === employe.id).length, 1);
});

test("l'employé peut refuser une invitation (DELETE /comptes/moi/rattachements/:id)", async () => {
  const gerant = await creerGerant();
  const employe = await creerCompte();
  await inviter(gerant.jeton, gerant.lieuId, employe.email);
  const id = memoire.rattachements.find((r) => r.compteId === employe.id)?.id;
  assert.equal((await demander("DELETE", `/comptes/moi/rattachements/${id}`, { jeton: gerant.jeton })).statut, 404, "pas à lui");
  assert.deepEqual((await demander("DELETE", `/comptes/moi/rattachements/${id}`, { jeton: employe.jeton })).corps, { ok: true });
  assert.equal((await demander("POST", `/comptes/moi/rattachements/${id}/accepter`, { jeton: employe.jeton })).statut, 404);
});

test("réservé au gérant : un membre « equipe » ne voit ni ne touche l'équipe", async () => {
  const gerant = await creerGerant();
  const employe = await creerCompte();
  await inviter(gerant.jeton, gerant.lieuId, employe.email);
  const id = memoire.rattachements.find((r) => r.compteId === employe.id)?.id;
  await demander("POST", `/comptes/moi/rattachements/${id}/accepter`, { jeton: employe.jeton });
  const autre = await creerCompte();
  for (const [methode, chemin, corps] of [
    ["GET", `/pro/lieux/${gerant.lieuId}/equipe`, undefined], ["POST", `/pro/lieux/${gerant.lieuId}/equipe`, { email: autre.email }],
    ["DELETE", `/pro/lieux/${gerant.lieuId}/equipe/${employe.id}`, undefined],
  ] as const) {
    const reponse = await demander(methode, chemin, { jeton: employe.jeton, corps });
    assert.deepEqual([reponse.statut, reponse.corps], [403, { ok: false, erreur: "reserve-au-gerant" }], `${methode} ${chemin}`);
  }
});

test("limites : 10 invitations par lieu et par 24 h, 30 membres au plus, 30 essais par gérant, et par visiteur", async () => {
  const gerant = await creerGerant();
  for (let i = 0; i < INVITATIONS_PAR_JOUR; i++) assert.equal((await inviter(gerant.jeton, gerant.lieuId, (await creerCompte()).email)).statut, 201);
  const trop = await inviter(gerant.jeton, gerant.lieuId, (await creerCompte()).email);
  assert.deepEqual([trop.statut, trop.corps], [409, { ok: false, erreur: "trop-d-invitations" }]);

  // 30 membres au plus (posés directement : la limite par jour n'est pas en jeu ici)
  const complet = await creerGerant();
  for (let i = 0; i < MEMBRES_EQUIPE_MAX; i++) {
    const membre = await creerCompte();
    memoire.rattachements.push({ id: 10_000 + i, lieuId: complet.lieuId, compteId: membre.id, role: "equipe", preuve: "test", siret: null, statut: "valide", reponse: null, creeLe: banc.horloge - 2 * 86_400_000, decideLe: null });
  }
  assert.deepEqual((await inviter(complet.jeton, complet.lieuId, (await creerCompte()).email)).corps, { ok: false, erreur: "equipe-complete" });

  // Essais par gérant, réussis ou non (on ne sonde pas les e-mails)
  const curieux = await creerGerant();
  for (let i = 0; i < ESSAIS_INVITATION_PAR_JOUR; i++) await inviter(curieux.jeton, curieux.lieuId, `inconnu${i}@exemple.fr`);
  const bloque = await inviter(curieux.jeton, curieux.lieuId, "encore@exemple.fr");
  assert.deepEqual([bloque.statut, bloque.corps.erreur], [429, "trop-de-demandes"]);

  // Par visiteur
  const autre = await creerGerant();
  const ip = "203.0.113.9";
  for (let i = 0; i < LIMITE_INVITATIONS.maximum; i++) await inviter(autre.jeton, autre.lieuId, "x", ip);
  assert.equal((await inviter(autre.jeton, autre.lieuId, "x", ip)).statut, 429);
});
