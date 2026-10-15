import assert from "node:assert/strict";
import { test } from "node:test";

import { suivreLectureReservations } from "~/fonctions/reservations/suivre-lecture-reservations";

const resa = (id, statut = "demandee") => ({ id, statut, creneau: "2026-10-15T18:00:00.000Z" });
const ATTENTE = { etat: "attente" };

test("pas de réseau à l'ouverture : « Pas de réseau », puis la liste dès qu'une lecture réussit ailleurs", () => {
  const coupe = suivreLectureReservations(ATTENTE, { type: "ratee", erreur: "hors-ligne" });
  assert.deepEqual(coupe, { etat: "erreur", erreur: "hors-ligne" });
  const revenu = suivreLectureReservations(coupe, { type: "lue-ailleurs", reservations: [resa(1)] });
  assert.deepEqual(revenu, { etat: "lu", reservations: [resa(1)] });
});

test("le retour du réseau sort aussi d'une erreur serveur, et une liste vide est une vraie liste", () => {
  const panne = suivreLectureReservations(ATTENTE, { type: "ratee", erreur: "erreur-serveur" });
  assert.deepEqual(suivreLectureReservations(panne, { type: "lue-ailleurs", reservations: [] }), { etat: "lu", reservations: [] });
  assert.deepEqual(suivreLectureReservations(panne, { type: "lue", reservations: [resa(2)] }), { etat: "lu", reservations: [resa(2)] });
});

test("une lecture ratée après une lecture réussie garde la liste", () => {
  const lu = { etat: "lu", reservations: [resa(1)] };
  assert.equal(suivreLectureReservations(lu, { type: "ratee", erreur: "hors-ligne" }), lu);
});

test("une lecture faite ailleurs remplace la liste (réponse du lieu)", () => {
  const lu = { etat: "lu", reservations: [resa(1)] };
  assert.deepEqual(suivreLectureReservations(lu, { type: "lue-ailleurs", reservations: [resa(1, "acceptee")] }), { etat: "lu", reservations: [resa(1, "acceptee")] });
});

test("remplacer une réservation après un geste : seulement dans une liste déjà lue", () => {
  const lu = { etat: "lu", reservations: [resa(1), resa(2)] };
  assert.deepEqual(suivreLectureReservations(lu, { type: "remplacee", reservation: resa(2, "annulee") }), { etat: "lu", reservations: [resa(1), resa(2, "annulee")] });
  const erreur = { etat: "erreur", erreur: "hors-ligne" };
  assert.equal(suivreLectureReservations(erreur, { type: "remplacee", reservation: resa(2, "annulee") }), erreur);
  assert.equal(suivreLectureReservations(ATTENTE, { type: "remplacee", reservation: resa(2, "annulee") }), ATTENTE);
});
