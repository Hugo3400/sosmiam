// Tests des réservations côté client (/app/reservations) : créneaux, demande et ses limites, expiration, annulation et
// « Je suis là ». Le comptoir de l'équipe (accepter, « Venu »…) : reservations-comptoir.test.ts.
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
/** Ce soir, 20 h à Paris (heure d'été) ; le banc commence à midi */
const VINGT_HEURES = Date.parse("2026-10-09T18:00:00.000Z");
const DEMANDE = { lieuId: 1, personnes: 2, jour: "2026-10-09", heure: "20:00", message: "  Une table   en terrasse ?  " };

const reserver = (jeton: string, corps: Record<string, unknown> = {}) => b.demander("POST", "/app/reservations", jeton, { ...DEMANDE, ...corps });

/** Une réservation de ce soir 20 h, demandée par ce compte et acceptée par le gérant du lieu 1 */
async function reservationAcceptee(jeton: string, corps: Record<string, unknown> = {}) {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1);
  const r = await reserver(jeton, corps);
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  const ok = await b.demander("POST", `/pro/comptoir/reservations/${r.corps.reservation.id}/accepter`, gerant.jeton);
  assert.equal(ok.statut, 200, JSON.stringify(ok.corps));
  return r.corps.reservation.id as number;
}

/** Un autre lieu réservable, copie du lieu 1 */
function ajouterLieu(id: number, autres: Record<string, unknown> = {}) {
  b.visites.lieux.set(id, { ...b.visites.lieux.get(1)!, id, nom: `Lieu ${id}`, ...autres });
}

test("sans session : 401 partout", async () => {
  for (const [methode, chemin] of [["GET", "/app/reservations"], ["GET", "/app/reservations/creneaux?lieuId=1&jour=2026-10-09"], ["POST", "/app/reservations"],
    ["POST", "/pro/comptoir/reservations/1/accepter"], ["GET", "/pro/comptoir/lieux/1/reservations"]]) {
    assert.equal((await b.demander(methode, chemin)).statut, 401, chemin);
  }
});

test("créneaux : dans les horaires, 30 min après maintenant ; lieu non réservable ou non vérifié ; bar pour un 15-17 ans", async () => {
  const lea = await b.creerCompte();
  const r = await b.demander("GET", "/app/reservations/creneaux?lieuId=1&jour=2026-10-09", lea.jeton);
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.equal(r.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual(r.corps.creneaux, ["12:30", "13:00", "13:30", "14:00", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"]);
  assert.deepEqual((await b.demander("GET", "/app/reservations/creneaux?lieuId=1&jour=2026-10-08", lea.jeton)).corps.creneaux, []);
  for (const [requete, champ] of [["lieuId=1&jour=demain", "jour"], ["lieuId=abc&jour=2026-10-09", "lieuId"], ["jour=2026-10-09", "lieuId"]]) {
    const x = await b.demander("GET", `/app/reservations/creneaux?${requete}`, lea.jeton);
    assert.deepEqual([x.statut, x.corps.erreur, x.corps.champ], [400, "champ-invalide", champ], requete);
  }
  assert.equal((await b.demander("GET", "/app/reservations/creneaux?lieuId=9&jour=2026-10-09", lea.jeton)).statut, 404);

  ajouterLieu(2, { reservable: false });
  ajouterLieu(3, { verifie: false });
  for (const lieuId of [2, 3]) {
    const non = await b.demander("GET", `/app/reservations/creneaux?lieuId=${lieuId}&jour=2026-10-09`, lea.jeton);
    assert.deepEqual([non.statut, non.corps.erreur, non.corps.details], [409, "lieu-non-reservable", { lieu: `Lieu ${lieuId}` }]);
  }
  // Un bar n'existe pas pour un 15-17 ans : jamais son nom
  ajouterLieu(4, { type: "bar" });
  const ado = await b.creerCompte({ naissance: "2010-03-01" });
  const bar = await b.demander("GET", "/app/reservations/creneaux?lieuId=4&jour=2026-10-09", ado.jeton);
  assert.deepEqual([bar.statut, bar.corps.erreur, bar.corps.details], [403, "mineur-bar", undefined]);
  assert.equal((await b.demander("GET", "/app/reservations/creneaux?lieuId=4&jour=2026-10-09", lea.jeton)).statut, 200);
  assert.equal((await reserver(ado.jeton, { lieuId: 4 })).corps.erreur, "mineur-bar");
});

test("demande : en attente, créneau à l'heure de Paris, petit mot nettoyé ; le lieu ne voit que prénom, initiale et emoji", async () => {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1);
  const lea = await b.creerCompte({ prenom: "Léa", nom: "Martin", avatar: "🐙", naissance: "1998-05-02" });
  const r = await reserver(lea.jeton);
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  const v = r.corps.reservation;
  assert.deepEqual(
    [v.statut, v.creneau, v.personnes, v.message, v.code, v.motifRefus, v.tardive, v.presenceLe, v.visiteId, v.demo, v.lieu.nom, v.creeLe],
    ["demandee", "2026-10-09T18:00:00.000Z", 2, "Une table en terrasse ?", null, null, false, null, null, false, "Chez Léa", "2026-10-09T10:00:00.000Z"],
  );
  assert.deepEqual((await b.demander("GET", "/app/reservations", lea.jeton)).corps.reservations, [v]);
  assert.deepEqual((await b.demander("GET", `/app/reservations/${v.id}`, lea.jeton)).corps.reservation, v);
  const autre = await b.creerCompte();
  assert.equal((await b.demander("GET", `/app/reservations/${v.id}`, autre.jeton)).statut, 404);
  const pro = await b.demander("GET", "/pro/comptoir/lieux/1/reservations", gerant.jeton);
  assert.deepEqual(pro.corps.reservations, [{
    id: v.id, prenom: "Léa", initialeNom: "M", avatar: "🐙", personnes: 2, creneau: v.creneau, message: "Une table en terrasse ?",
    statut: "demandee", presence: false, code: null, creeLe: v.creeLe,
  }]);
});

test("demande refusée : e-mail, champs, petit mot, équipe du lieu ; une demande en attente par lieu", async () => {
  const sansEmail = await b.creerCompte({ emailVerifie: false });
  assert.deepEqual([(await reserver(sansEmail.jeton)).statut, (await reserver(sansEmail.jeton)).corps.erreur], [403, "email-non-verifie"]);
  const lea = await b.creerCompte();
  const cas: [Record<string, unknown>, number, string][] = [
    [{ personnes: 13 }, 400, "personnes-invalides"], [{ personnes: "2" }, 400, "personnes-invalides"],
    [{ heure: "15:00" }, 400, "creneau-invalide"], [{ heure: "12:15" }, 400, "creneau-invalide"], [{ jour: "2026-12-25" }, 400, "creneau-invalide"],
    [{ message: "Espèce de connard" }, 400, "message-refuse"], [{ message: "x".repeat(141) }, 400, "message-refuse"],
    [{ lieuId: "1" }, 400, "champ-invalide"], [{ lieuId: 9 }, 404, "introuvable"],
  ];
  for (const [corps, statut, erreur] of cas) {
    const r = await reserver(lea.jeton, corps);
    assert.deepEqual([r.statut, r.corps.erreur], [statut, erreur], JSON.stringify(corps));
  }
  const membre = await b.creerCompte();
  b.rattacher(membre.id, 1, "equipe");
  assert.deepEqual([(await reserver(membre.jeton)).statut, (await reserver(membre.jeton)).corps.erreur], [403, "membre-du-lieu"]);
  // Sans petit mot : null
  const ok = await reserver(lea.jeton, { message: undefined });
  assert.deepEqual([ok.statut, ok.corps.reservation.message], [201, null]);
  const encore = await reserver(lea.jeton, { heure: "21:00" });
  assert.deepEqual([encore.statut, encore.corps.erreur, encore.corps.details], [409, "reservation-en-cours", { lieu: "Chez Léa", lieuId: 1 }]);
  assert.equal(b.visites.reservations.length, 1);
});

test("3 réservations à venir au plus, demandées ou acceptées ; une annulée libère la place", async () => {
  for (const id of [2, 3, 4]) ajouterLieu(id);
  const lea = await b.creerCompte();
  const premiere = await reservationAcceptee(lea.jeton);
  for (const lieuId of [2, 3]) assert.equal((await reserver(lea.jeton, { lieuId })).statut, 201);
  const trop = await reserver(lea.jeton, { lieuId: 4 });
  assert.deepEqual([trop.statut, trop.corps.erreur], [409, "trop-de-reservations"]);
  assert.equal((await b.demander("POST", `/app/reservations/${premiere}/annuler`, lea.jeton)).statut, 200);
  assert.equal((await reserver(lea.jeton, { lieuId: 4 })).statut, 201);
  // Une réservation passée ne compte plus : demain, il y a de nouveau de la place
  b.banc.horloge = Date.parse("2026-10-10T08:00:00.000Z");
  assert.equal((await reserver(lea.jeton, { lieuId: 1, jour: "2026-10-10" })).statut, 201);
});

test("expiration : sans réponse, la demande expire 30 min avant le créneau ; le lieu ne peut plus l'accepter", async () => {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1);
  const lea = await b.creerCompte();
  const { id } = (await reserver(lea.jeton)).corps.reservation;
  b.banc.horloge = VINGT_HEURES - 31 * MINUTE;
  assert.equal((await b.demander("GET", `/app/reservations/${id}`, lea.jeton)).corps.reservation.statut, "demandee");
  b.banc.horloge = VINGT_HEURES - 30 * MINUTE;
  assert.equal((await b.demander("GET", `/app/reservations/${id}`, lea.jeton)).corps.reservation.statut, "expiree");
  const tard = await b.demander("POST", `/pro/comptoir/reservations/${id}/accepter`, gerant.jeton);
  assert.deepEqual([tard.statut, tard.corps.erreur], [409, "delai-depasse"]);
  // Expirée, elle n'est plus « en attente » : on peut redemander un autre créneau
  assert.equal((await reserver(lea.jeton, { heure: "21:00" })).statut, 201);
});

test("annulation par le client : une demande, ou une acceptée avant le créneau (tardive à moins de 2 h)", async () => {
  const lea = await b.creerCompte();
  const demande = (await reserver(lea.jeton)).corps.reservation.id;
  const annulee = await b.demander("POST", `/app/reservations/${demande}/annuler`, lea.jeton);
  assert.deepEqual([annulee.statut, annulee.corps.reservation.statut, annulee.corps.reservation.tardive], [200, "annulee", false]);
  assert.equal((await b.demander("POST", `/app/reservations/${demande}/annuler`, lea.jeton)).corps.erreur, "transition-interdite");

  const sam = await b.creerCompte({ prenom: "Sam" });
  const tot = await reservationAcceptee(sam.jeton);
  b.banc.horloge = VINGT_HEURES - 3 * 60 * MINUTE;
  assert.equal((await b.demander("POST", `/app/reservations/${tot}/annuler`, sam.jeton)).corps.reservation.tardive, false);

  const zoe = await b.creerCompte({ prenom: "Zoé" });
  b.banc.horloge = Date.parse("2026-10-09T10:00:00.000Z");
  const tardive = await reservationAcceptee(zoe.jeton);
  b.banc.horloge = VINGT_HEURES - 90 * MINUTE;
  const vue = (await b.demander("POST", `/app/reservations/${tardive}/annuler`, zoe.jeton)).corps.reservation;
  assert.deepEqual([vue.statut, vue.tardive, vue.code], ["annulee", true, null]);
  assert.equal(b.visites.reservations.find((r) => r.id === tardive)?.tardive, true);

  const noe = await b.creerCompte({ prenom: "Noé" });
  b.banc.horloge = Date.parse("2026-10-09T10:00:00.000Z");
  const passee = await reservationAcceptee(noe.jeton);
  b.banc.horloge = VINGT_HEURES + MINUTE;
  assert.equal((await b.demander("POST", `/app/reservations/${passee}/annuler`, noe.jeton)).corps.erreur, "delai-depasse");
  assert.equal((await b.demander("POST", `/app/reservations/${passee}/annuler`, lea.jeton)).statut, 404);
});

test("« Je suis là » : une fois, sur place, d'une heure avant le créneau à 4 h après ; jamais sur une simple demande", async () => {
  const lea = await b.creerCompte();
  const id = await reservationAcceptee(lea.jeton);
  const presence = (position: unknown = SUR_PLACE) => b.demander("POST", `/app/reservations/${id}/presence`, lea.jeton, { position });
  const tot = await presence();
  assert.deepEqual([tot.statut, tot.corps.erreur], [409, "hors-fenetre-presence"]);
  b.banc.horloge = VINGT_HEURES - 50 * MINUTE;
  const loin = await presence({ ...SUR_PLACE, latitude: 43.62 });
  assert.deepEqual([loin.statut, loin.corps.erreur, loin.corps.details.lieu], [422, "hors-zone", "Chez Léa"]);
  assert.deepEqual([(await presence({ latitude: 1 })).statut, (await presence({ latitude: 1 })).corps.champ], [400, "position"]);
  const ok = await presence();
  assert.equal(ok.statut, 200, JSON.stringify(ok.corps));
  assert.deepEqual([ok.corps.reservation.statut, ok.corps.reservation.presenceLe, ok.corps.validation], ["acceptee", "2026-10-09T17:10:00.000Z", null]);
  assert.equal((await presence()).corps.erreur, "transition-interdite");
  assert.deepEqual([b.points, b.visites.visites], [[], []]);
  // La position n'est jamais gardée
  assert.equal(JSON.stringify(b.visites.reservations).includes("43.61"), false);

  const sam = await b.creerCompte({ prenom: "Sam" });
  const demande = (await reserver(sam.jeton)).corps.reservation.id;
  assert.equal((await b.demander("POST", `/app/reservations/${demande}/presence`, sam.jeton, { position: SUR_PLACE })).corps.erreur, "transition-interdite");
  b.banc.horloge = VINGT_HEURES + 4 * 60 * MINUTE + MINUTE;
  const lea2 = await b.creerCompte();
  assert.equal((await b.demander("POST", `/app/reservations/${id}/presence`, lea2.jeton, { position: SUR_PLACE })).statut, 404);
});
