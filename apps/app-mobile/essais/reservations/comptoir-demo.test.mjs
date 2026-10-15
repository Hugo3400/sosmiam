import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { allumerDemo } from "~/services/demo/demo-visites-active";

allumerDemo();
const { LIEU_DEMO_PRO_ID, lieuDemoPro } = await import("~/contenus/lieu-demo-pro");
const { calculerEtatComptoirDemo } = await import("~/services/demo/calculer-etat-comptoir-demo");
const { creerMagasinDemo } = await import("~/services/demo/magasin-demo");
const { creerReservationsDemo } = await import("~/services/demo/reservations-demo");
const { creerReservationsProDemo } = await import("~/services/demo/reservations-pro-demo");

const MOI = { cle: "moi", prenom: "Hugo", initialeNom: "R", avatar: "🦁" };
const ROLE_BOUIBOUI = { ambassadeur: null, pro: [{ id: LIEU_DEMO_PRO_ID, nom: "Restaurant du Capitaine Bouiboui", emoji: "🛟", role: "gerant" }] };
const SANS_ROLE = { ambassadeur: null, pro: [] };
const REGLAGES = { vraiePosition: false, lieuxRepondentSeuls: false, avisAccelere: false, pepin: null };

function monterDemo(debut, reglages = REGLAGES) {
  const etat = { maintenantMs: debut, roles: SANS_ROLE };
  const maintenant = () => etat.maintenantMs;
  const magasin = creerMagasinDemo({ maintenant });
  const ctx = { magasin, lireClient: () => MOI, lireRoles: () => etat.roles, lireReglages: () => reglages, maintenant };
  return { etat, magasin, client: creerReservationsDemo(ctx), pro: creerReservationsProDemo(ctx) };
}

test("sans le rôle du lieu, pas de liste ni de réponse", async () => {
  const d = monterDemo(calculerInstantParis("2026-10-15", "15:00"));
  await d.magasin.remettreAZero();
  assert.deepEqual(await d.pro.listerReservations(LIEU_DEMO_PRO_ID), { ok: false, erreur: "role-requis" });
  const [karim] = await d.magasin.lire((m) => m.reservations.filter((r) => r.client === "figurant:karim"));
  assert.deepEqual(await d.pro.repondreReservation(karim.id, { accepter: true }), { ok: false, erreur: "role-requis" });
});

test("au comptoir de démo : la demande de Karim s'accepte (code d'arrivée), la table d'Inès est attendue avec son code", async () => {
  const d = monterDemo(calculerInstantParis("2026-10-15", "15:00"));
  await d.magasin.remettreAZero();
  d.etat.roles = ROLE_BOUIBOUI;
  const liste = await d.pro.listerReservations(LIEU_DEMO_PRO_ID);
  assert.equal(liste.ok, true);
  const karim = liste.reservations.find((r) => r.prenom === "Karim");
  const ines = liste.reservations.find((r) => r.prenom === "Inès");
  assert.equal(karim.statut, "demandee");
  assert.equal(karim.initialeNom, "B");
  assert.equal("age" in karim, false);
  assert.equal(ines.statut, "acceptee");
  assert.match(ines.code, /^\d{4}$/);

  const etat = await d.magasin.lire((m, ms) => calculerEtatComptoirDemo(m, lieuDemoPro, ms, MOI));
  assert.equal(etat.reservationsARepondre, 1);
  assert.deepEqual(etat.arrivees.map((r) => r.prenom), ["Inès"]);

  const reponse = await d.pro.repondreReservation(karim.id, { accepter: true });
  assert.equal(reponse.ok, true);
  assert.equal(reponse.reservation.statut, "acceptee");
  assert.match(reponse.reservation.code, /^\d{4}$/);
  assert.deepEqual(await d.pro.repondreReservation(karim.id, { accepter: true }), { ok: false, erreur: "transition-interdite" });
});

test("membre du lieu : on ne réserve pas chez soi, comme l'API ; sans le rôle, la demande arrive au comptoir et se refuse", async () => {
  const d = monterDemo(calculerInstantParis("2026-10-15", "15:00"));
  await d.magasin.remettreAZero();
  const demande = { lieuId: LIEU_DEMO_PRO_ID, personnes: 2, jour: "2026-10-15", heure: "20:00", message: "Une table près de la fenêtre ?" };

  d.etat.roles = ROLE_BOUIBOUI;
  assert.deepEqual(await d.client.listerCreneaux(LIEU_DEMO_PRO_ID, "2026-10-15"), { ok: false, erreur: "membre-du-lieu" });
  assert.deepEqual(await d.client.reserver(demande), { ok: false, erreur: "membre-du-lieu" });

  d.etat.roles = SANS_ROLE;
  const faite = await d.client.reserver(demande);
  assert.equal(faite.ok, true);

  d.etat.roles = ROLE_BOUIBOUI;
  const liste = await d.pro.listerReservations(LIEU_DEMO_PRO_ID);
  const mienne = liste.reservations.find((r) => r.id === faite.reservation.id);
  assert.equal(mienne.prenom, "Hugo");
  assert.equal(mienne.message, "Une table près de la fenêtre ?");

  assert.deepEqual(await d.pro.repondreReservation(mienne.id, { accepter: false, motif: "pas-un-motif" }), { ok: false, erreur: "champ-invalide", champ: "motif" });
  const refus = await d.pro.repondreReservation(mienne.id, { accepter: false, motif: "complet" });
  assert.equal(refus.ok, true);
  assert.equal(refus.reservation.statut, "refusee");

  d.etat.roles = SANS_ROLE;
  const vue = await d.client.lireReservation(mienne.id);
  assert.equal(vue.reservation.statut, "refusee");
  assert.equal(vue.reservation.motifRefus, "complet");
});

test("trop tard pour répondre : la demande s'endort 30 min avant le créneau, et le comptoir le dit (delai-depasse)", async () => {
  const d = monterDemo(calculerInstantParis("2026-10-15", "15:00"));
  await d.magasin.remettreAZero();
  const faite = await d.client.reserver({ lieuId: LIEU_DEMO_PRO_ID, personnes: 3, jour: "2026-10-15", heure: "19:00", message: null });
  assert.equal(faite.ok, true);
  d.etat.roles = ROLE_BOUIBOUI;
  d.etat.maintenantMs = calculerInstantParis("2026-10-15", "18:30");
  assert.deepEqual(await d.pro.repondreReservation(faite.reservation.id, { accepter: true }), { ok: false, erreur: "delai-depasse" });
  const liste = await d.pro.listerReservations(LIEU_DEMO_PRO_ID);
  assert.equal(liste.reservations.find((r) => r.id === faite.reservation.id).statut, "expiree");
});

test("« Venu » et « Pas venu » suivent les fenêtres de la règle partagée", async () => {
  const d = monterDemo(calculerInstantParis("2026-10-15", "15:00"));
  await d.magasin.remettreAZero();
  const faite = await d.client.reserver({ lieuId: LIEU_DEMO_PRO_ID, personnes: 2, jour: "2026-10-15", heure: "20:00", message: null });
  d.etat.roles = ROLE_BOUIBOUI;
  await d.pro.repondreReservation(faite.reservation.id, { accepter: true });
  d.etat.maintenantMs = calculerInstantParis("2026-10-15", "19:29");
  assert.deepEqual(await d.pro.marquerArrivee(faite.reservation.id, true), { ok: false, erreur: "transition-interdite" });
  assert.deepEqual(await d.pro.marquerArrivee(faite.reservation.id, false), { ok: false, erreur: "transition-interdite" });
  d.etat.maintenantMs = calculerInstantParis("2026-10-15", "20:31");
  const absent = await d.pro.marquerArrivee(faite.reservation.id, false);
  assert.equal(absent.ok, true);
  assert.equal(absent.reservation.statut, "absent");
});

test("délai d'une heure : la démo refuse un créneau à moins d'une heure, comme l'API", async () => {
  const d = monterDemo(calculerInstantParis("2026-10-15", "19:31"));
  await d.magasin.remettreAZero();
  const creneaux = await d.client.listerCreneaux(LIEU_DEMO_PRO_ID, "2026-10-15");
  assert.equal(creneaux.creneaux[0], "21:00");
  assert.deepEqual(await d.client.reserver({ lieuId: LIEU_DEMO_PRO_ID, personnes: 2, jour: "2026-10-15", heure: "20:30", message: null }), { ok: false, erreur: "creneau-invalide" });
});

const laisserPasser = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));
};

test("démo : le « Venu » automatique attend que « Venu » soit permis (créneau − 30 min), au lieu d'échouer en silence", async (t) => {
  const d = monterDemo(calculerInstantParis("2026-10-15", "18:00"), { ...REGLAGES, lieuxRepondentSeuls: true });
  await d.magasin.remettreAZero();
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const faite = await d.client.reserver({ lieuId: LIEU_DEMO_PRO_ID, personnes: 2, jour: "2026-10-15", heure: "19:00", message: null });
  assert.equal(faite.ok, true);
  const id = faite.reservation.id;
  const statut = async () => (await d.client.lireReservation(id)).reservation;

  d.etat.maintenantMs += 8_000;
  t.mock.timers.tick(8_000);
  await laisserPasser();
  assert.equal((await statut()).statut, "acceptee");

  d.etat.maintenantMs = calculerInstantParis("2026-10-15", "18:10");
  const sur = await d.client.signalerPresence(id, { latitude: 43.6008, longitude: 3.8972, precision: 10, ageMs: 1_000, simulee: false });
  assert.equal(sur.ok, true);
  assert.notEqual(sur.reservation.presenceLe, null);

  d.etat.maintenantMs += 8_000;
  t.mock.timers.tick(8_000);
  await laisserPasser();
  assert.equal((await statut()).statut, "acceptee", "« Venu » ne part pas 40 min avant le créneau");

  d.etat.maintenantMs = calculerInstantParis("2026-10-15", "18:30") + 1_000;
  t.mock.timers.tick(20 * 60_000);
  await laisserPasser();
  const venue = await statut();
  assert.equal(venue.statut, "honoree");
  assert.notEqual(venue.visiteId, null);
});
