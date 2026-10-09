// Tests des réservations côté équipe du lieu (/pro/comptoir) : accepter, refuser, annuler, « Venu » et « Pas venu », rôles,
// lieu relu sur la réservation, visite validée quand « Venu » et « Je suis là » sont réunis, état du comptoir.
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { creerBancVisites, SUR_PLACE } from "./outils/creer-banc-visites.ts";

let b: Awaited<ReturnType<typeof creerBancVisites>>;
before(async () => { b = await creerBancVisites(); });
after(() => b.fermer());
beforeEach(() => {
  b.vider();
  b.visites.lieux.get(1)!.reservable = true;
});

const MINUTE = 60_000;
const MIDI = Date.parse("2026-10-09T10:00:00.000Z");
/** Ce soir, 20 h à Paris (heure d'été) */
const VINGT_HEURES = Date.parse("2026-10-09T18:00:00.000Z");
const PROGRAMME = { actif: true, visitesRequises: 3, recompense: "Un verre de muscat", alcool: true, recompenseSansAlcool: "Une citronnade maison" };

async function equipe() {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1, "gerant");
  const serveur = await b.creerCompte({ prenom: "Nina" });
  b.rattacher(serveur.id, 1, "equipe");
  return { gerant, serveur };
}

/** Une demande de ce compte au lieu 1 (ce soir 20 h par défaut) */
async function reserver(jeton: string, corps: Record<string, unknown> = {}) {
  const r = await b.demander("POST", "/app/reservations", jeton, { lieuId: 1, personnes: 2, jour: "2026-10-09", heure: "20:00", message: null, ...corps });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  return r.corps.reservation.id as number;
}

const geste = (id: number, nom: string, jeton: string, corps?: unknown) => b.demander("POST", `/pro/comptoir/reservations/${id}/${nom}`, jeton, corps);
const presence = (id: number, jeton: string) => b.demander("POST", `/app/reservations/${id}/presence`, jeton, { position: SUR_PLACE });

test("accepter, refuser, annuler : code d'arrivée, motifs fermés, et ce que voit le client", async () => {
  const { serveur } = await equipe();
  const lea = await b.creerCompte();
  const id = await reserver(lea.jeton);
  const ok = await geste(id, "accepter", serveur.jeton);
  assert.equal(ok.statut, 200, JSON.stringify(ok.corps));
  assert.equal(ok.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual([ok.corps.reservation.statut, ok.corps.reservation.code], ["acceptee", "1234"]);
  assert.equal((await geste(id, "accepter", serveur.jeton)).corps.erreur, "transition-interdite");
  const vue = (await b.demander("GET", `/app/reservations/${id}`, lea.jeton)).corps.reservation;
  assert.deepEqual([vue.statut, vue.code, vue.reponduLe], ["acceptee", "1234", "2026-10-09T10:00:00.000Z"]);
  assert.equal(b.visites.reservations[0]?.reponduParId, serveur.id);

  const sam = await b.creerCompte({ prenom: "Sam" });
  const autre = await reserver(sam.jeton);
  for (const corps of [undefined, { motif: "plus de place, désolé" }]) {
    const r = await geste(autre, "refuser", serveur.jeton, corps);
    assert.deepEqual([r.statut, r.corps.erreur, r.corps.champ], [400, "champ-invalide", "motif"]);
  }
  assert.equal((await geste(autre, "refuser", serveur.jeton, { motif: "complet" })).corps.reservation.statut, "refusee");
  const refusee = (await b.demander("GET", `/app/reservations/${autre}`, sam.jeton)).corps.reservation;
  assert.deepEqual([refusee.statut, refusee.motifRefus, refusee.code], ["refusee", "complet", null]);

  // Le lieu ne peut plus l'honorer : annulée, avec un motif de la liste
  const annulee = await geste(id, "annuler", serveur.jeton, { motif: "ferme" });
  assert.deepEqual([annulee.statut, annulee.corps.reservation.statut], [200, "annulee"]);
  const vueAnnulee = (await b.demander("GET", `/app/reservations/${id}`, lea.jeton)).corps.reservation;
  assert.deepEqual([vueAnnulee.motifRefus, vueAnnulee.tardive], ["ferme", false]);
});

test("rôles : pas de l'équipe, mineur, ou équipe d'un autre lieu → role-requis ; le lieu est relu sur la réservation", async () => {
  await equipe();
  b.visites.lieux.set(2, { ...b.visites.lieux.get(1)!, id: 2, nom: "Le Comptoir" });
  const ailleurs = await b.creerCompte({ prenom: "Paul" });
  b.rattacher(ailleurs.id, 2, "gerant");
  const inconnu = await b.creerCompte();
  const ado = await b.creerCompte({ naissance: "2010-03-01" });
  b.rattacher(ado.id, 1, "equipe");
  const lea = await b.creerCompte();
  const id = await reserver(lea.jeton);
  for (const jeton of [inconnu.jeton, ado.jeton, ailleurs.jeton, lea.jeton]) {
    for (const nom of ["accepter", "venu", "absent"]) {
      const r = await geste(id, nom, jeton, {});
      assert.deepEqual([r.statut, r.corps.erreur], [403, "role-requis"]);
    }
    assert.equal((await b.demander("GET", "/pro/comptoir/lieux/1/reservations", jeton)).corps.erreur, "role-requis");
  }
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/2/reservations", ailleurs.jeton)).corps.reservations.length, 0);
  assert.equal((await geste(999, "accepter", ailleurs.jeton)).statut, 404);
  assert.equal((await b.demander("POST", "/pro/comptoir/reservations/abc/accepter", ailleurs.jeton)).corps.champ, "reservationId");
  assert.equal(b.visites.reservations[0]?.statut, "demandee");
});

test("« Je suis là » puis « Venu » : visite validée, +15, tampon et avis, une seule fois", async () => {
  const { gerant, serveur } = await equipe();
  assert.equal((await b.demander("PUT", "/pro/comptoir/lieux/1/programme", gerant.jeton, PROGRAMME)).statut, 200);
  const lea = await b.creerCompte();
  const id = await reserver(lea.jeton);
  await geste(id, "accepter", serveur.jeton);
  b.banc.horloge = VINGT_HEURES - 20 * MINUTE;
  assert.equal((await presence(id, lea.jeton)).corps.validation, null);
  b.banc.horloge = VINGT_HEURES + 5 * MINUTE;
  const venu = await geste(id, "venu", serveur.jeton);
  assert.equal(venu.statut, 200, JSON.stringify(venu.corps));
  assert.deepEqual([venu.corps.reservation.statut, venu.corps.reservation.presence], ["honoree", true]);
  assert.deepEqual(b.points, [{ compteId: lea.id, valeur: 15, raison: "visite" }]);
  const visite = b.visites.visites.find((v) => v.reservationId === id);
  assert.ok(visite);
  assert.deepEqual(
    [visite.mode, visite.statut, visite.points, visite.tampon, visite.pendantSos, visite.decideParId, visite.resultatPosition, visite.avisOuvertLe?.toISOString(), visite.reglement?.type],
    ["reservation", "validee", 15, true, false, serveur.id, "dans-rayon", "2026-10-09T19:05:00.000Z", "paye"],
  );
  assert.equal((await b.demander("GET", `/app/reservations/${id}`, lea.jeton)).corps.reservation.visiteId, visite.id);
  assert.equal((await b.demander("GET", "/app/fidelite/cartes", lea.jeton)).corps.cartes[0].tampons, 1);
  // Le comptoir la montre dans ses validations récentes (annulable 15 min, comme les autres)
  const etat = (await b.demander("GET", "/pro/comptoir/lieux/1", serveur.jeton)).corps.etat;
  assert.deepEqual(etat.validees.map((v: { visiteId: number; mode: string }) => [v.visiteId, v.mode]), [[visite.id, "reservation"]]);
  // Plus rien ne se refait
  assert.equal((await geste(id, "venu", serveur.jeton)).corps.erreur, "transition-interdite");
  assert.equal((await presence(id, lea.jeton)).corps.erreur, "transition-interdite");
  assert.equal(b.visites.visites.length, 1);
  assert.equal(b.points.length, 1);
});

test("« Venu » puis « Je suis là » : la visite est validée à la présence, avec la carte de fidélité", async () => {
  const { gerant, serveur } = await equipe();
  await b.demander("PUT", "/pro/comptoir/lieux/1/programme", gerant.jeton, PROGRAMME);
  const lea = await b.creerCompte();
  const id = await reserver(lea.jeton);
  await geste(id, "accepter", gerant.jeton);
  b.banc.horloge = VINGT_HEURES + 10 * MINUTE;
  const venu = await geste(id, "venu", serveur.jeton);
  assert.deepEqual([venu.corps.reservation.statut, venu.corps.reservation.presence], ["honoree", false]);
  assert.deepEqual([b.points, b.visites.visites], [[], []]);
  b.banc.horloge = VINGT_HEURES + 20 * MINUTE;
  const la = await presence(id, lea.jeton);
  assert.equal(la.statut, 200, JSON.stringify(la.corps));
  const { validation, reservation } = la.corps;
  assert.deepEqual(
    [validation.visite.mode, validation.visite.statut, validation.visite.points, validation.carte.tampons, validation.recompenseGagnee, validation.dejaValidee],
    ["reservation", "validee", 15, 1, false, false],
  );
  assert.deepEqual([reservation.statut, reservation.visiteId, reservation.presenceLe], ["honoree", validation.visite.id, "2026-10-09T18:20:00.000Z"]);
  assert.deepEqual(b.points, [{ compteId: lea.id, valeur: 15, raison: "visite" }]);
  // Validée par le membre de l'équipe qui a touché « Venu »
  assert.equal(b.visites.visites[0]?.decideParId, serveur.id);
  assert.equal((await presence(id, lea.jeton)).corps.erreur, "transition-interdite");
  assert.equal(b.points.length, 1);
});

test("« Venu » de 30 min avant à 4 h après le créneau ; « Pas venu » 30 min après ; lieu qui ne valide pas : pas de visite", async () => {
  const { serveur } = await equipe();
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const zoe = await b.creerCompte({ prenom: "Zoé" });
  const [a, s, z] = [await reserver(lea.jeton), await reserver(sam.jeton), await reserver(zoe.jeton)];
  for (const id of [a, s, z]) await geste(id, "accepter", serveur.jeton);
  b.banc.horloge = VINGT_HEURES - 31 * MINUTE;
  assert.equal((await geste(a, "venu", serveur.jeton)).corps.erreur, "transition-interdite");
  b.banc.horloge = VINGT_HEURES + 29 * MINUTE;
  assert.equal((await geste(a, "absent", serveur.jeton)).corps.erreur, "transition-interdite");
  b.banc.horloge = VINGT_HEURES + 30 * MINUTE;
  const absent = await geste(a, "absent", serveur.jeton);
  assert.deepEqual([absent.statut, absent.corps.reservation.statut], [200, "absent"]);
  assert.equal((await b.demander("GET", `/app/reservations/${a}`, lea.jeton)).corps.reservation.statut, "absent");

  // Le lieu ne valide plus les visites : la réservation est honorée, mais rien ne compte
  b.visites.lieux.get(1)!.validationActive = false;
  await presence(s, sam.jeton);
  const sansVisite = await geste(s, "venu", serveur.jeton);
  assert.deepEqual([sansVisite.statut, sansVisite.corps.reservation.statut], [200, "honoree"]);
  assert.deepEqual([b.visites.visites, b.points], [[], []]);

  b.banc.horloge = VINGT_HEURES + 4 * 60 * MINUTE + MINUTE;
  assert.equal((await geste(z, "venu", serveur.jeton)).corps.erreur, "delai-depasse");
});

test("SOS du soir : +25 si la réservation a été demandée pendant le SOS, pour un créneau avant sa fin", async () => {
  const { serveur } = await equipe();
  const avant = await b.creerCompte({ prenom: "Sam" });
  const pendant = await b.creerCompte({ prenom: "Léa" });
  const demain = await b.creerCompte({ prenom: "Zoé" });
  const s = await reserver(avant.jeton);
  b.visites.sos.push({ lieuId: 1, creeLe: new Date(MIDI + 30 * MINUTE), jusqua: new Date(Date.parse("2026-10-09T21:00:00.000Z")), arreteLe: null });
  b.banc.horloge = MIDI + 60 * MINUTE;
  const l = await reserver(pendant.jeton);
  const z = await reserver(demain.jeton, { jour: "2026-10-10" });
  for (const id of [s, l]) await geste(id, "accepter", serveur.jeton);
  // Le SOS s'arrête avant le dîner (places remplies) : la demande a été faite pendant, elle compte quand même
  b.visites.sos[0]!.arreteLe = new Date(MIDI + 90 * MINUTE);
  b.banc.horloge = VINGT_HEURES;
  for (const [id, jeton] of [[s, avant.jeton], [l, pendant.jeton]] as const) {
    await presence(id, jeton);
    assert.equal((await geste(id, "venu", serveur.jeton)).statut, 200);
  }
  assert.deepEqual(b.points.map((p) => [p.compteId, p.valeur, p.raison]), [[avant.id, 15, "visite"], [pendant.id, 25, "visite-sos"]]);
  await geste(z, "accepter", serveur.jeton);
  b.banc.horloge = Date.parse("2026-10-10T18:00:00.000Z");
  await presence(z, demain.jeton);
  await geste(z, "venu", serveur.jeton);
  assert.deepEqual(b.points.at(-1), { compteId: demain.id, valeur: 15, raison: "visite" });
});

test("état du comptoir : arrivées du jour et demandes à traiter ; liste du jour et à venir ; codes jamais en double", async () => {
  const { gerant, serveur } = await equipe();
  const lea = await b.creerCompte({ prenom: "Léa", nom: "Martin", avatar: "🐙" });
  const sam = await b.creerCompte({ prenom: "Sam" });
  const zoe = await b.creerCompte({ prenom: "Zoé" });
  const a = await reserver(lea.jeton, { message: "Anniversaire de Tom" });
  const s = await reserver(sam.jeton, { jour: "2026-10-10" });
  const z = await reserver(zoe.jeton, { heure: "21:00" });
  for (const id of [a, s]) await geste(id, "accepter", serveur.jeton);

  let etat = (await b.demander("GET", "/pro/comptoir/lieux/1", gerant.jeton)).corps.etat;
  const creeLe = "2026-10-09T10:00:00.000Z";
  assert.deepEqual(etat.arrivees, [{
    id: a, prenom: "Léa", initialeNom: "M", avatar: "🐙", personnes: 2, creneau: "2026-10-09T18:00:00.000Z", message: "Anniversaire de Tom",
    statut: "acceptee", presence: false, code: "1234", creeLe,
  }]);
  assert.equal(etat.reservationsARepondre, 1);
  const liste = (await b.demander("GET", "/pro/comptoir/lieux/1/reservations", serveur.jeton)).corps.reservations;
  assert.deepEqual(liste.map((r: { id: number; statut: string }) => [r.id, r.statut]), [[a, "acceptee"], [z, "demandee"], [s, "acceptee"]]);

  // Une addition demandée ne reprend jamais le code d'une table attendue (1234 et 1235 sont pris : on retire)
  b.banc.tirage = 0;
  const bob = await b.creerCompte({ prenom: "Bob" });
  const addition = await b.demander("POST", "/app/visites/addition", bob.jeton, { lieuId: 1, position: SUR_PLACE });
  assert.equal(addition.corps.visite.code, "1236");

  // 20 h 30 : Léa est là ; la demande de Zoé pour 21 h, restée sans réponse, expire
  b.banc.horloge = VINGT_HEURES + 30 * MINUTE;
  await presence(a, lea.jeton);
  etat = (await b.demander("GET", "/pro/comptoir/lieux/1", gerant.jeton)).corps.etat;
  assert.deepEqual([etat.arrivees.map((r: { presence: boolean }) => r.presence), etat.reservationsARepondre], [[true], 0]);
  await geste(a, "venu", serveur.jeton);
  assert.deepEqual((await b.demander("GET", "/pro/comptoir/lieux/1", gerant.jeton)).corps.etat.arrivees, []);

  // Après minuit, la soirée d'hier reste visible tant que « Venu » est possible ; le jour d'avant, non
  b.banc.horloge = Date.parse("2026-10-10T08:00:00.000Z");
  const lendemain = (await b.demander("GET", "/pro/comptoir/lieux/1/reservations", serveur.jeton)).corps.reservations;
  assert.deepEqual(lendemain.map((r: { id: number }) => r.id), [s]);
  assert.deepEqual((await b.demander("GET", "/pro/comptoir/lieux/1", gerant.jeton)).corps.etat.arrivees.map((r: { id: number }) => r.id), [s]);
});
