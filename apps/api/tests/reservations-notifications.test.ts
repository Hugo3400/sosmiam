import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { ecrireMomentReservation } from "../src/fonctions/reservations/ecrire-moment-reservation.ts";
import { ecrireNotificationReservation } from "../src/fonctions/reservations/ecrire-notification-reservation.ts";
import { creerPrevenirReponses, suivreExpirations } from "../src/services/reponses-reservations.ts";
import type { LigneReservation, ReponseReservation } from "../src/services/reservations-regles.ts";
import { creerVisitesEnMemoire } from "../src/services/visites-en-memoire.ts";
import { creerPassageExpirationReservations } from "../src/taches/expirer-reservations.ts";
import { creerBancVisites, LIEU_TEST } from "./outils/creer-banc-visites.ts";

let b: Awaited<ReturnType<typeof creerBancVisites>>;
before(async () => { b = await creerBancVisites(); });
after(() => b.fermer());
beforeEach(() => {
  b.vider();
  b.visites.lieux.get(1)!.reservable = true;
});

const MINUTE = 60_000;
const VINGT_HEURES = Date.parse("2026-10-09T18:00:00.000Z");
const LIEN = "/reservations";

async function equipe() {
  const serveur = await b.creerCompte({ prenom: "Nina" });
  b.rattacher(serveur.id, 1, "equipe");
  return serveur;
}

async function reserver(jeton: string, corps: Record<string, unknown> = {}) {
  const r = await b.demander("POST", "/app/reservations", jeton, { lieuId: 1, personnes: 2, jour: "2026-10-09", heure: "20:00", message: null, ...corps });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  return r.corps.reservation.id as number;
}

const geste = (id: number, nom: string, jeton: string, corps?: unknown) => b.demander("POST", `/pro/comptoir/reservations/${id}/${nom}`, jeton, corps);

async function prevenus() {
  await b.attendreEnvois();
  return b.prevenus.map((p) => ({ compteId: p.compteId, ...p.message }));
}

test("accepter : le client est prévenu une fois (lieu, heure de Paris, lien), jamais celui qui répond", async () => {
  const serveur = await equipe();
  const lea = await b.creerCompte();
  const id = await reserver(lea.jeton);
  assert.deepEqual(await prevenus(), [], "une demande ne prévient personne");
  assert.equal((await geste(id, "accepter", serveur.jeton)).statut, 200);
  assert.deepEqual(await prevenus(), [{
    compteId: lea.id, titre: "C'est réservé ! 🎉", texte: "Chez Léa t'attend ce soir à 20h. Ton code d'arrivée est dans Mes réservations.", lien: LIEN,
  }]);
  assert.equal((await geste(id, "accepter", serveur.jeton)).corps.erreur, "transition-interdite");
  assert.equal((await prevenus()).length, 1, "réponse rejouée : pas de doublon");
});

test("refuser et annuler côté lieu : le motif fermé, la table ou la place ; rien quand le client annule, « Venu » ou « Pas venu »", async () => {
  const serveur = await equipe();
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const zoe = await b.creerCompte({ prenom: "Zoé" });
  const refusee = await reserver(lea.jeton, { jour: "2026-10-10", heure: "12:30" });
  assert.equal((await geste(refusee, "refuser", serveur.jeton, { motif: "complet" })).statut, 200);
  assert.equal((await geste(refusee, "refuser", serveur.jeton, { motif: "complet" })).statut, 409);
  const annulee = await reserver(sam.jeton);
  await geste(annulee, "accepter", serveur.jeton);
  assert.equal((await geste(annulee, "annuler", serveur.jeton, { motif: "ferme" })).statut, 200);
  assert.equal((await geste(annulee, "annuler", serveur.jeton, { motif: "ferme" })).statut, 409);
  const parLeClient = await reserver(zoe.jeton);
  assert.equal((await b.demander("POST", `/app/reservations/${parLeClient}/annuler`, zoe.jeton)).statut, 200);
  assert.deepEqual(await prevenus(), [
    { compteId: lea.id, titre: "Pas cette fois 😕", texte: "Chez Léa a répondu pour demain à 12h30 : « C'est complet ». Plein d'autres créneaux (et d'autres pépites) t'attendent !", lien: LIEN },
    { compteId: sam.id, titre: "C'est réservé ! 🎉", texte: "Chez Léa t'attend ce soir à 20h. Ton code d'arrivée est dans Mes réservations.", lien: LIEN },
    { compteId: sam.id, titre: "Changement de programme 😕", texte: "Chez Léa a dû annuler ta table pour ce soir à 20h : « On est fermés à ce moment-là ». Désolé pour le contretemps, tu n'y es pour rien.", lien: LIEN },
  ]);

  b.prevenus.length = 0;
  const tom = await b.creerCompte({ prenom: "Tom" });
  const venu = await reserver(tom.jeton, { heure: "21:00" });
  const noe = await b.creerCompte({ prenom: "Noé" });
  const absent = await reserver(noe.jeton, { heure: "19:00" });
  for (const id of [venu, absent]) await geste(id, "accepter", serveur.jeton);
  assert.equal((await prevenus()).length, 2);
  b.prevenus.length = 0;
  b.banc.horloge = Date.parse("2026-10-09T19:00:00.000Z");
  assert.equal((await geste(venu, "venu", serveur.jeton)).statut, 200);
  assert.equal((await geste(absent, "absent", serveur.jeton)).statut, 200);
  assert.deepEqual(await prevenus(), []);
});

test("le membre de l'équipe qui répond à sa propre demande n'est jamais prévenu", async () => {
  await equipe();
  const lea = await b.creerCompte();
  const id = await reserver(lea.jeton);
  b.rattacher(lea.id, 1, "equipe");
  assert.equal((await geste(id, "accepter", lea.jeton)).statut, 200);
  assert.deepEqual(await prevenus(), []);
});

test("expiration : prévenu une seule fois, quelle que soit la lecture qui la fait expirer", async () => {
  const serveur = await equipe();
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const zoe = await b.creerCompte({ prenom: "Zoé" });
  await reserver(lea.jeton);
  await reserver(sam.jeton, { heure: "20:30" });
  await reserver(zoe.jeton, { heure: "21:00" });
  b.banc.horloge = VINGT_HEURES - 31 * MINUTE;
  await b.demander("GET", "/app/reservations", lea.jeton);
  assert.deepEqual(await prevenus(), []);

  b.banc.horloge = VINGT_HEURES - 30 * MINUTE;
  assert.equal((await b.demander("GET", "/app/reservations", lea.jeton)).corps.reservations[0].statut, "expiree");
  await b.demander("GET", "/app/reservations", lea.jeton);
  await b.demander("GET", "/pro/comptoir/lieux/1/reservations", serveur.jeton);
  assert.deepEqual(await prevenus(), [{
    compteId: lea.id, titre: "Pas de réponse à temps 😴",
    texte: "Chez Léa n'a pas pu répondre à temps pour ce soir à 20h. Ta demande s'est endormie, pas ton appétit : tente un autre créneau !", lien: LIEN,
  }]);

  b.banc.horloge = VINGT_HEURES;
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/1", serveur.jeton)).corps.etat.reservationsARepondre, 1);
  assert.deepEqual((await prevenus()).map((p) => p.compteId), [lea.id, sam.id], "l'écran du comptoir fait expirer aussi");
  b.banc.horloge = VINGT_HEURES + 30 * MINUTE;
  assert.equal((await geste(b.visites.reservations[2]!.id, "accepter", serveur.jeton)).corps.erreur, "delai-depasse");
  assert.deepEqual((await prevenus()).map((p) => p.compteId), [lea.id, sam.id, zoe.id], "le geste trop tard fait expirer, sans « réservé »");
});

test("expiration découverte après le créneau (serveur arrêté) : endormie sans notification", async () => {
  const lea = await b.creerCompte();
  const id = await reserver(lea.jeton);
  b.banc.horloge = VINGT_HEURES;
  assert.equal((await b.demander("GET", `/app/reservations/${id}`, lea.jeton)).corps.reservation.statut, "expiree");
  assert.deepEqual(await prevenus(), []);
});

test("tâche de la minute : fait expirer et prévient, une seule fois ; une erreur est notée, jamais levée", async () => {
  const lea = await b.creerCompte();
  await reserver(lea.jeton, { heure: "21:00" });
  const passer = creerPassageExpirationReservations({ ...b.visitesApp, horloge: () => b.banc.horloge });
  assert.equal(await passer(), 0);
  b.banc.horloge = VINGT_HEURES + 30 * MINUTE;
  assert.equal(await passer(), 1);
  assert.equal(await passer(), 0);
  assert.deepEqual((await prevenus()).map((p) => [p.compteId, p.titre]), [[lea.id, "Pas de réponse à temps 😴"]]);

  const enPanne = creerPassageExpirationReservations({
    depot: { lire: () => Promise.reject(new Error("base")), ecrire: () => Promise.reject(new Error("base")) }, prevenirCompte: async () => {},
  });
  const erreurs: unknown[] = [];
  const console_error = console.error;
  console.error = (...x: unknown[]) => void erreurs.push(x);
  try {
    assert.equal(await enPanne(), 0);
  } finally {
    console.error = console_error;
  }
  assert.equal(erreurs.length, 1);
});

test("suivreExpirations : après une transaction réussie seulement ; une lecture prévient même si la suite échoue", async () => {
  const memoire = creerVisitesEnMemoire();
  memoire.lieux.set(1, { ...LIEU_TEST, publie: true });
  const ligne = (id: number): LigneReservation => ({
    id, compteId: 7, lieuId: 1, personnes: 2, creneau: new Date(VINGT_HEURES), message: null, statut: "demandee", motifRefus: null, tardive: false,
    creeLe: new Date(VINGT_HEURES - 5 * 3600_000), reponduLe: null, reponduParId: null, presenceLe: null, code: null,
  });
  memoire.reservations.push(ligne(1), ligne(2));
  const recues: ReponseReservation[][] = [];
  const depot = suivreExpirations(memoire.depot, (r) => void recues.push([...r]));
  const maintenant = new Date(VINGT_HEURES - 20 * MINUTE);
  await assert.rejects(depot.ecrire(async (t) => {
    await t.expirerReservations(maintenant);
    throw new Error("annulée");
  }));
  assert.deepEqual(recues, [], "transaction annulée : personne n'est prévenu");
  for (const r of memoire.reservations) r.statut = "demandee";
  await assert.rejects(depot.lire(async (t) => {
    await t.expirerReservations(maintenant);
    throw new Error("après");
  }));
  assert.deepEqual(recues.map((r) => r.map((x) => [x.compteId, x.statut, x.lieu.nom])), [[[7, "expiree", "Chez Léa"], [7, "expiree", "Chez Léa"]]]);
  assert.deepEqual(await depot.ecrire((t) => t.expirerReservations(maintenant)), []);
  assert.equal(recues.length, 1);
});

test("creerPrevenirReponses : un envoi raté ne casse rien", async () => {
  const erreurs: unknown[] = [];
  const console_error = console.error;
  console.error = (...x: unknown[]) => void erreurs.push(x);
  try {
    const prevenir = creerPrevenirReponses(() => Promise.reject(new Error("APNs")), () => VINGT_HEURES - 3600_000);
    prevenir([{ compteId: 1, lieu: { id: 1, nom: "Chez Léa", emoji: "🍝", type: "resto", ville: "" }, creneau: new Date(VINGT_HEURES), statut: "acceptee", motif: null }]);
    await b.attendreEnvois();
    await b.attendreEnvois();
  } finally {
    console.error = console_error;
  }
  assert.equal(erreurs.length, 1);
});

test("textes : aujourd'hui, ce soir, demain ou la date, toujours à l'heure de Paris ; « ta place » pour une sortie", () => {
  const midi = new Date("2026-10-09T10:00:00.000Z");
  assert.equal(ecrireMomentReservation(new Date("2026-10-09T10:30:00.000Z"), midi), "aujourd'hui à 12h30");
  assert.equal(ecrireMomentReservation(new Date("2026-10-09T16:00:00.000Z"), midi), "ce soir à 18h");
  assert.equal(ecrireMomentReservation(new Date("2026-10-10T17:30:00.000Z"), midi), "demain à 19h30");
  assert.equal(ecrireMomentReservation(new Date("2026-10-17T18:00:00.000Z"), midi), "samedi 17 octobre à 20h");
  assert.equal(ecrireMomentReservation(new Date("2026-11-01T19:00:00.000Z"), midi), "dimanche 1er novembre à 20h", "heure d'hiver");
  const minuitEtDemie = new Date("2026-10-09T22:30:00.000Z");
  assert.equal(ecrireMomentReservation(new Date("2026-10-10T18:00:00.000Z"), minuitEtDemie), "ce soir à 20h", "après minuit à Paris, c'est déjà le 10");

  const sortie: ReponseReservation = {
    compteId: 1, lieu: { id: 2, nom: "Le Laser Game", emoji: "🎯", type: "sortie", ville: "" }, creneau: new Date(VINGT_HEURES), statut: "annulee", motif: null,
  };
  assert.deepEqual(ecrireNotificationReservation(sortie, midi), {
    titre: "Changement de programme 😕",
    texte: "Le Laser Game a dû annuler ta place pour ce soir à 20h : « On ne peut pas cette fois ». Désolé pour le contretemps, tu n'y es pour rien.",
    lien: LIEN,
  });
});
