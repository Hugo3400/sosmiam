// Tests de la limitation d'un compte dans le logiciel de gestion (services de la session Site, en mémoire) : limiter avec
// motif, pourquoi et durée ; une seule à la fois ; lever ; réexaminer seulement une contestation ; mails demandés ; journal
// sans le pourquoi ; 503 sans le service.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerLimitationsEnMemoire } from "../src/services/limitations-comptes-en-memoire.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const journal: string[] = [];
const mails: string[] = [];
const services = {
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  listerLimitationsEnCours: async () => [],
  prevenirCompteLimite: async (l: { compteId: number }) => (mails.push(`limite:${l.compteId}`), true),
  prevenirLimitationLevee: async (l: { compteId: number }, apresReexamen: boolean, message: string | null) => (mails.push(`levee:${l.compteId}:${apresReexamen}:${message}`), true),
  prevenirLimitationMaintenue: async (l: { compteId: number }, message: string | null) => (mails.push(`maintenue:${l.compteId}:${message}`), true),
};
const { services: limitations } = creerLimitationsEnMemoire(Date.now, (id) => id !== 404);
const banc = await creerBancGestion(services as never, undefined, null, undefined, undefined, undefined, limitations);
const sansService = await creerBancGestion(services as never);
let session = "";
let sessionSans = "";
before(async () => void ([session, sessionSans] = await Promise.all([banc.ouvrirSession(), sansService.ouvrirSession()])));
after(() => Promise.all([banc.fermer(), sansService.fermer()]));

const limiter = (compteId: number, corps: unknown) => banc.demander("POST", `/comptes/${compteId}/limitations`, { session, corps });
const corps = { motif: "haine", motivation: "Messages insultants envoyés à plusieurs personnes.", jours: 7 };

test("limiter : champs vérifiés, une seule à la fois, mail demandé, journal sans le pourquoi", async () => {
  assert.equal((await limiter(3, { ...corps, motif: "piano" })).status, 400);
  assert.equal((await limiter(3, { ...corps, motivation: "court" })).status, 400);
  assert.equal((await limiter(3, { ...corps, jours: 5 })).status, 400);
  assert.equal((await limiter(404, corps)).status, 404);
  const reponse = await limiter(3, corps);
  assert.equal(reponse.status, 200);
  const { limitation } = await reponse.json();
  assert.ok(limitation.fin && Date.parse(limitation.fin) > Date.now() + 6.9 * 86_400_000);
  assert.match(journal.at(-1)!, /^Compte limité · compte n° 3, limitation n° \d+, motif « haine », fin : \d{4}-\d{2}-\d{2}$/);
  assert.ok(!journal.at(-1)!.includes("insultants"));
  assert.deepEqual(mails, ["limite:3"]);
  assert.equal((await limiter(3, { ...corps, jours: null })).status, 409);
  const fiche = await (await banc.demander("GET", "/comptes/3/limitations", { session })).json();
  assert.equal(fiche.enVigueur.id, limitation.id);
  assert.equal(fiche.toutes.length, 1);
});

test("réexaminer : seulement une contestation ; lever : une seule fois", async () => {
  mails.length = 0;
  const { limitation } = await (await limiter(5, { ...corps, jours: null })).json();
  assert.equal((await banc.demander("POST", `/limitations/${limitation.id}/reexamen`, { session, corps: { lever: true } })).status, 409);
  assert.equal((await limitations.contesterLimitation(5, "Je n'ai insulté personne, c'était une blague entre amis.")).ok, true);
  assert.equal((await banc.demander("POST", `/limitations/${limitation.id}/reexamen`, { session, corps: { lever: "oui" } })).status, 400);
  assert.equal((await banc.demander("POST", `/limitations/${limitation.id}/reexamen`, { session, corps: { lever: false, message: "On a relu les messages." } })).status, 200);
  assert.equal(journal.at(-1), `Réexamen de limitation : maintenue · limitation n° ${limitation.id}, compte n° 5`);
  assert.equal((await banc.demander("POST", `/limitations/${limitation.id}/levee`, { session, corps: {} })).status, 200);
  assert.equal((await banc.demander("POST", `/limitations/${limitation.id}/levee`, { session, corps: {} })).status, 409);
  assert.equal((await banc.demander("POST", "/limitations/999/levee", { session, corps: {} })).status, 404);
  assert.deepEqual(mails, ["limite:5", "maintenue:5:On a relu les messages.", "levee:5:false:null"]);
});

test("sans le service de la session Site : 503", async () => {
  assert.equal((await sansService.demander("POST", "/comptes/3/limitations", { session: sessionSans, corps })).status, 503);
  assert.equal((await sansService.demander("GET", "/limitations", { session: sessionSans })).status, 503);
});
