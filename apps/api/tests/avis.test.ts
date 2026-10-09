// Tests des avis côté client (/app/avis) : fenêtre d'avis, un par visite, signature, points d'une photo, repas offert,
// avis non vérifié, lecture publique (moyenne prudente, part de clients qui reviennent, pagination).
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { creerBancAvis } from "./outils/creer-banc-avis.ts";

let b: Awaited<ReturnType<typeof creerBancAvis>>;
before(async () => { b = await creerBancAvis(); });
after(() => b.fermer());
beforeEach(() => b.vider());

const HEURE = 3600_000;
const TEXTE = "Des pâtes fraîches comme à Rome, et un tiramisu qui mérite le détour.";
const donner = (jeton: string, corps: Record<string, unknown>) => b.demander("POST", "/app/avis", jeton, { note: 5, texte: TEXTE, photo: null, ...corps });
const nonVerifie = (jeton: string, corps: Record<string, unknown> = {}) =>
  b.demander("POST", "/app/avis/non-verifie", jeton, { lieuId: 2, note: 4, texte: "Crêpes dorées, cidre frais, accueil adorable.", photo: null, ...corps });

test("fenêtre d'avis : 1 h après la validation, pendant 14 jours, seulement sa visite validée", async () => {
  const lea = await b.creerCompte({ nom: "Martin" });
  const intrus = await b.creerCompte({ prenom: "Max" });
  const visite = b.creerVisite(lea.id, 1);
  assert.deepEqual((await b.demander("GET", "/app/avis/a-ecrire", lea.jeton)).corps.visites, []);
  assert.equal((await donner(lea.jeton, { visiteId: visite })).corps.erreur, "avis-pas-ouvert");
  b.banc.horloge += HEURE;
  const aEcrire = await b.demander("GET", "/app/avis/a-ecrire", lea.jeton);
  assert.equal(aEcrire.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual(aEcrire.corps.visites.map((v: { id: number; avis: unknown }) => [v.id, v.avis]), [
    [visite, { ouvertLe: "2026-10-09T11:00:00.000Z", fermeLe: "2026-10-23T11:00:00.000Z", donne: false }],
  ]);
  const pasLaSienne = await donner(intrus.jeton, { visiteId: visite });
  assert.deepEqual([pasLaSienne.statut, pasLaSienne.corps.erreur], [404, "introuvable"]);
  // 14 jours plus tard : fermé
  b.banc.horloge += 14 * b.JOUR;
  const ferme = await donner(lea.jeton, { visiteId: visite });
  assert.deepEqual([ferme.statut, ferme.corps.erreur], [409, "avis-ferme"]);
  // Une visite refusée n'ouvre jamais d'avis
  const refusee = b.creerVisite(lea.id, 1, { statut: "refusee" });
  assert.equal((await donner(lea.jeton, { visiteId: refusee })).corps.erreur, "avis-pas-ouvert");
  assert.equal((await b.demander("GET", "/app/avis/a-ecrire")).statut, 401);
});

test("un avis par visite, signé « Prénom I. », daté au mois, visible tout de suite", async () => {
  const lea = await b.creerCompte({ prenom: "Léa", nom: "martin", naissance: "1998-05-02" });
  const visite = b.creerVisite(lea.id, 1);
  b.banc.horloge += 2 * HEURE;
  const r = await donner(lea.jeton, { visiteId: visite, texte: `  ${TEXTE}  ` });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.deepEqual(r.corps, {
    ok: true, pointsGagnes: 0,
    avis: {
      id: r.corps.avis.id, note: 5, texte: TEXTE, photo: null, signature: "Léa M.", preuve: "comptoir", mois: "2026-10", reponseLieu: null,
      verifie: true, repasOffert: false, avecReduction: false,
    },
  });
  const deux = await donner(lea.jeton, { visiteId: visite });
  assert.deepEqual([deux.statut, deux.corps.erreur], [409, "avis-deja-donne"]);
  assert.deepEqual((await b.demander("GET", "/app/avis/a-ecrire", lea.jeton)).corps.visites, []);
  assert.equal(b.donnees.visites[0]!.avisDonne, true);
  const publics = (await b.demander("GET", "/app/avis/lieux/1")).corps;
  assert.deepEqual(publics.avis, [r.corps.avis]);
  assert.deepEqual(b.points, []);
});

test("signature : prénom seul pour un 15-17 ans ou sans nom, jamais l'âge ; date illisible : prudence", async () => {
  const ado = await b.creerCompte({ prenom: "Inès", nom: "Durand", naissance: "2010-03-01" });
  const sansNom = await b.creerCompte({ prenom: "  Karim  " });
  const dateIllisible = await b.creerCompte({ prenom: "Zoé", nom: "Petit" });
  b.donnees.comptes.get(dateIllisible.id)!.dateNaissanceChiffree = "illisible";
  const visites = [ado, sansNom, dateIllisible].map((c) => b.creerVisite(c.id, 1));
  b.banc.horloge += 2 * HEURE;
  const signatures: string[] = [];
  for (const [i, c] of [ado, sansNom, dateIllisible].entries()) {
    const r = await donner(c.jeton, { visiteId: visites[i] });
    assert.equal(r.statut, 201, JSON.stringify(r.corps));
    signatures.push(r.corps.avis.signature);
    assert.equal("mineur" in r.corps.avis || "age" in r.corps.avis, false);
  }
  assert.deepEqual(signatures, ["Inès", "Karim", "Zoé"]);
  // Date illisible : traité comme un 15-17 ans, par prudence
  assert.deepEqual(b.donnees.avis.map((a) => a.mineur), [true, false, true]);
});

test("photo : +10 points (avis-photo) pour un avis vérifié, rien pour un repas offert ; photo inconnue refusée", async () => {
  const lea = await b.creerCompte({ nom: "Martin" });
  const payee = b.creerVisite(lea.id, 1);
  const offerte = b.creerVisite(lea.id, 1, { reglement: { type: "offert", reductionPourcent: null, avantages: [] } });
  const reduite = b.creerVisite(lea.id, 1, { reglement: { type: "reduction", reductionPourcent: 20, avantages: [] } });
  b.banc.horloge += 2 * HEURE;
  const inconnue = await donner(lea.jeton, { visiteId: payee, photo: "photo-autre.jpg" });
  assert.deepEqual([inconnue.statut, inconnue.corps.erreur, inconnue.corps.champ], [400, "avis-invalide", "photo"]);
  assert.equal((await donner(lea.jeton, { visiteId: payee, photo: "../secret.txt" })).corps.champ, "photo");
  assert.equal(b.donnees.visites[0]!.avisDonne, false);

  const avecPhoto = await donner(lea.jeton, { visiteId: payee, photo: `photo-${lea.id}.jpg` });
  assert.deepEqual([avecPhoto.statut, avecPhoto.corps.pointsGagnes, avecPhoto.corps.avis.photo], [201, 10, `photo-${lea.id}.jpg`]);
  assert.deepEqual(b.points, [{ compteId: lea.id, valeur: 10, raison: "avis-photo", detail: `avis ${avecPhoto.corps.avis.id}, lieu 1` }]);

  const offert = await donner(lea.jeton, { visiteId: offerte, photo: `photo-${lea.id}.jpg` });
  assert.deepEqual([offert.corps.pointsGagnes, offert.corps.avis.repasOffert, offert.corps.avis.avecReduction], [0, true, false]);
  const reduit = await donner(lea.jeton, { visiteId: reduite, note: 3 });
  assert.deepEqual([reduit.corps.avis.repasOffert, reduit.corps.avis.avecReduction], [false, true]);
  assert.equal(b.points.length, 1);
});

test("texte : 10 à 1000 caractères, sans insulte ; note de 1 à 5 ; l'équipe du lieu ne note pas chez elle", async () => {
  const lea = await b.creerCompte();
  const visite = b.creerVisite(lea.id, 1);
  b.banc.horloge += 2 * HEURE;
  for (const corps of [{ texte: "Bof." }, { texte: "x".repeat(1001) }, { note: 6 }, { note: 2.5 }, { texte: "Le serveur est un connard." }, { visiteId: "1" }]) {
    const r = await donner(lea.jeton, { visiteId: visite, ...corps });
    assert.deepEqual([r.statut, r.corps.erreur], [400, "avis-invalide"], JSON.stringify(corps));
  }
  // Une critique, ça passe
  const critique = await donner(lea.jeton, { visiteId: visite, note: 1, texte: "Froid, long et cher. Vraiment déçue cette fois." });
  assert.equal(critique.statut, 201);

  const serveuse = await b.creerCompte({ prenom: "Nina" });
  const sienne = b.creerVisite(serveuse.id, 1);
  b.rattacher(serveuse.id, 1, "equipe");
  b.banc.horloge += 2 * HEURE;
  const membre = await donner(serveuse.jeton, { visiteId: sienne });
  assert.deepEqual([membre.statut, membre.corps.erreur], [403, "membre-du-lieu"]);
});

test("avis non vérifié : seulement chez un lieu non vérifié, sans points, un par lieu tous les 30 jours", async () => {
  const lea = await b.creerCompte({ nom: "Martin" });
  const verifie = await nonVerifie(lea.jeton, { lieuId: 1 });
  assert.deepEqual([verifie.statut, verifie.corps.erreur], [409, "avis-visite-requise"]);
  assert.deepEqual([(await nonVerifie(lea.jeton, { lieuId: 4 })).statut, (await nonVerifie(lea.jeton, { lieuId: 99 })).corps.erreur], [404, "lieu-inconnu"]);

  const r = await nonVerifie(lea.jeton, { photo: `photo-${lea.id}.jpg` });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.deepEqual([r.corps.pointsGagnes, r.corps.avis.verifie, r.corps.avis.preuve, r.corps.avis.signature, r.corps.avis.repasOffert], [0, false, null, "Léa M.", false]);
  assert.deepEqual(b.points, []);

  b.banc.horloge += 29 * b.JOUR;
  const recent = await nonVerifie(lea.jeton, { note: 2 });
  assert.deepEqual([recent.statut, recent.corps.erreur, recent.corps.details], [409, "avis-recent", { jusqua: "2026-11-08T10:00:00.000Z" }]);
  // Un autre lieu non vérifié : permis
  assert.equal((await nonVerifie(lea.jeton, { lieuId: 3 })).statut, 201);
  b.banc.horloge += b.JOUR;
  assert.equal((await nonVerifie(lea.jeton, { note: 2 })).statut, 201);
});

test("avis non vérifié refusé : bar pour un 15-17 ans, e-mail pas vérifié, lieu lié, contenu", async () => {
  const ado = await b.creerCompte({ prenom: "Inès", naissance: "2010-03-01" });
  assert.deepEqual([(await nonVerifie(ado.jeton, { lieuId: 3 })).statut, (await nonVerifie(ado.jeton, { lieuId: 3 })).corps.erreur], [403, "mineur-bar"]);
  assert.equal((await nonVerifie(ado.jeton)).statut, 201);
  const sansEmail = await b.creerCompte({ emailVerifie: false });
  assert.equal((await nonVerifie(sansEmail.jeton)).corps.erreur, "email-non-verifie");
  // Quelqu'un qui demande à gérer ce lieu (rattachement en attente) ne le note pas
  const patron = await b.creerCompte({ lies: [2] });
  assert.equal((await nonVerifie(patron.jeton)).corps.erreur, "membre-du-lieu");
  assert.equal((await nonVerifie(patron.jeton, { lieuId: 0 })).corps.erreur, "avis-invalide");
  assert.equal((await nonVerifie(patron.jeton, { texte: "court" })).corps.erreur, "avis-invalide");
});

test("lecture publique : moyenne prudente, part de clients qui reviennent dès 20 clients, cache public", async () => {
  for (const note of [5, 5, 4, 2]) await b.ajouterAvis({ lieuId: 1, note });
  await b.ajouterAvis({ lieuId: 1, note: 1, statut: "en-relecture", raisonRelecture: "tirage" });
  await b.ajouterAvis({ lieuId: 1, note: 1, statut: "masque" });
  await b.ajouterAvis({ lieuId: 2, note: 1 });
  // 19 clients : pas encore de part de retour
  for (let client = 100; client < 119; client++) b.creerVisite(client, 1, { valideLe: b.banc.horloge - 3 * b.JOUR });
  const r = await b.demander("GET", "/app/avis/lieux/1");
  assert.equal(r.statut, 200);
  assert.equal(r.entetes.get("cache-control"), "public, max-age=60");
  // (5 × 4 + 5 + 5 + 4 + 2 + 1) / (5 + 5) = 3,7 ; l'avis masqué ne compte pas, celui en relecture si
  assert.deepEqual(r.corps.resume, { moyenne: 3.7, nombre: 5, partRetour: null });
  assert.deepEqual(r.corps.avis.map((a: { note: number }) => a.note), [1, 2, 4, 5, 5]);
  assert.equal(r.corps.suite, null);
  // 20e client ; 5 clients reviennent un autre jour, 1 revient le même jour (ne compte pas)
  b.creerVisite(119, 1, { valideLe: b.banc.horloge - 3 * b.JOUR });
  for (let client = 100; client < 105; client++) b.creerVisite(client, 1, { valideLe: b.banc.horloge - b.JOUR });
  b.creerVisite(110, 1, { valideLe: b.banc.horloge - 3 * b.JOUR + HEURE });
  b.creerVisite(111, 1, { statut: "refusee" });
  assert.deepEqual((await b.demander("GET", "/app/avis/lieux/1")).corps.resume, { moyenne: 3.7, nombre: 5, partRetour: 0.25 });
  // Sans avis : pas de moyenne
  assert.deepEqual((await b.demander("GET", "/app/avis/lieux/3")).corps, { ok: true, resume: { moyenne: null, nombre: 0, partRetour: null }, avis: [], suite: null });
  const masque = await b.demander("GET", "/app/avis/lieux/4");
  assert.deepEqual([masque.statut, masque.corps.erreur], [404, "lieu-inconnu"]);
  assert.equal((await b.demander("GET", "/app/avis/lieux/abc")).corps.champ, "lieuId");
});

test("lecture publique : 30 avis par page, les plus récents d'abord, puis la suite", async () => {
  for (let i = 1; i <= 35; i++) await b.ajouterAvis({ lieuId: 2, note: 3, texte: `Avis numéro ${i}, très sincère.` });
  const premiere = (await b.demander("GET", "/app/avis/lieux/2")).corps;
  assert.equal(premiere.avis.length, 30);
  assert.equal(premiere.avis[0].texte, "Avis numéro 35, très sincère.");
  assert.equal(premiere.resume.nombre, 35);
  assert.equal(typeof premiere.suite, "string");
  const seconde = (await b.demander("GET", `/app/avis/lieux/2?apres=${premiere.suite}`)).corps;
  assert.deepEqual(seconde.avis.map((a: { texte: string }) => a.texte), [5, 4, 3, 2, 1].map((i) => `Avis numéro ${i}, très sincère.`));
  assert.equal(seconde.suite, null);
  assert.equal((await b.demander("GET", "/app/avis/lieux/2?apres=zz")).corps.champ, "apres");
});
