// Tests du bilan des réservations par lieu (logiciel de gestion) : sans réponse même avant le passage « expirée »,
// taux de réponse, délai médian, seuil « ne répond pas », et la route en lecture seule (période bornée).
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { repondPas, resumerReservationsLieux, type LigneReservation } from "../src/fonctions/reservations/resumer-reservations-lieux.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const maintenant = new Date("2026-10-15T12:00:00Z");
const heure = 3_600_000;
const ligne = (lieuId: number, statut: string, extra: Partial<LigneReservation> = {}): LigneReservation => ({
  lieuId, statut, motifRefus: null, tardive: false, creeLe: new Date(maintenant.getTime() - 48 * heure), reponduLe: null, creneau: new Date(maintenant.getTime() - 24 * heure), ...extra,
});

test("bilan : sans réponse, refus, absences, annulations et délai médian", () => {
  const { parLieu, tout } = resumerReservationsLieux([
    ligne(1, "expiree"),
    ligne(1, "demandee"), // créneau passé : sans réponse même si pas encore écrite « expirée »
    ligne(1, "demandee", { creneau: new Date(maintenant.getTime() + 5 * heure) }), // encore en attente
    ligne(1, "refusee", { motifRefus: "complet", reponduLe: new Date(maintenant.getTime() - 47 * heure) }),
    ligne(1, "honoree", { reponduLe: new Date(maintenant.getTime() - 46 * heure) }),
    ligne(1, "absent", { reponduLe: new Date(maintenant.getTime() - 45 * heure) }),
    ligne(1, "annulee", { tardive: true }), // annulée avant toute réponse : ni répondue ni sans réponse
    ligne(2, "acceptee", { reponduLe: new Date(maintenant.getTime() - 47.5 * heure) }),
  ], maintenant);
  const a = parLieu.get(1)!;
  assert.equal(a.demandes, 7);
  assert.equal(a.enAttente, 1);
  assert.equal(a.sansReponse, 2);
  assert.equal(a.refusees, 1);
  assert.deepEqual(a.motifsRefus, { complet: 1 });
  assert.equal(a.acceptees, 2);
  assert.equal(a.honorees, 1);
  assert.equal(a.absents, 1);
  assert.equal(a.annulees, 1);
  assert.equal(a.tardives, 1);
  assert.equal(a.tauxReponse, 0.6); // 3 répondues sur 5 à juger
  assert.equal(a.reponseMedianeMin, 120);
  assert.equal(tout.demandes, 8);
  assert.equal(parLieu.get(2)!.tauxReponse, 1);
});

test("bilan : la marge d'expiration de chaque lieu (10 min à la main avec 30 min de délai)", () => {
  const dansVingt = { creneau: new Date(maintenant.getTime() + heure / 3) };
  const { parLieu } = resumerReservationsLieux([ligne(1, "demandee", dansVingt), ligne(2, "demandee", dansVingt)], maintenant, new Map([[2, 10 * 60_000]]));
  assert.deepEqual([parLieu.get(1)!.sansReponse, parLieu.get(1)!.enAttente], [1, 0]);
  assert.deepEqual([parLieu.get(2)!.sansReponse, parLieu.get(2)!.enAttente], [0, 1]);
});

test("« ne répond pas » : au moins 3 sans réponse et une demande sur deux au plus traitée", () => {
  const trois = resumerReservationsLieux([ligne(1, "expiree"), ligne(1, "expiree"), ligne(1, "expiree"), ligne(1, "refusee", { reponduLe: maintenant })], maintenant);
  assert.equal(repondPas(trois.parLieu.get(1)!), true);
  const deux = resumerReservationsLieux([ligne(1, "expiree"), ligne(1, "expiree")], maintenant);
  assert.equal(repondPas(deux.parLieu.get(1)!), false);
  const repond = resumerReservationsLieux([ligne(1, "expiree"), ligne(1, "expiree"), ligne(1, "expiree"), ...Array.from({ length: 4 }, () => ligne(1, "honoree", { reponduLe: maintenant }))], maintenant);
  assert.equal(repondPas(repond.parLieu.get(1)!), false);
});

const appels: unknown[] = [];
const banc = await creerBancGestion({
  lireReservationsGestion: async (options: unknown) => (appels.push(options), { jours: 30, totaux: {}, lieux: [] }),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("GET /reservations : période bornée à 30, 90 ou 365 jours, ville passée telle quelle", async () => {
  assert.equal((await banc.demander("GET", "/reservations?jours=90&ville=S%C3%A8te", { session })).status, 200);
  assert.equal((await banc.demander("GET", "/reservations?jours=7", { session })).status, 200);
  assert.deepEqual(appels, [{ jours: 90, ville: "Sète" }, { jours: 30, ville: "" }]);
});
