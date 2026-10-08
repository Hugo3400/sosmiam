// Tests des notifications push : anti-spam, jetons signés pour Apple et Google, routes du logiciel de gestion.
import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { after, before, test } from "node:test";

import { depasseAntiSpam } from "../src/fonctions/notifications/depasse-anti-spam.ts";
import { signerJetonJwt } from "../src/fonctions/notifications/signer-jeton-jwt.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

test("anti-spam : 1 par jour, 4 par semaine", () => {
  const maintenant = new Date("2026-10-08T20:00:00Z");
  const ilYA = (heures: number) => new Date(maintenant.getTime() - heures * 3_600_000);
  assert.equal(depasseAntiSpam([], maintenant), false);
  assert.equal(depasseAntiSpam([ilYA(5)], maintenant), true, "déjà une aujourd'hui");
  assert.equal(depasseAntiSpam([ilYA(30), ilYA(60), ilYA(90)], maintenant), false, "3 cette semaine, aucune depuis 24 h");
  assert.equal(depasseAntiSpam([ilYA(30), ilYA(60), ilYA(90), ilYA(120)], maintenant), true, "4 cette semaine");
  assert.equal(depasseAntiSpam([ilYA(200), ilYA(300)], maintenant), false, "plus vieilles qu'une semaine");
});

test("jetons signés : ES256 (Apple, signature JOSE) et RS256 (Google) se vérifient avec la clé publique", () => {
  const apple = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const jeton = signerJetonJwt("ES256", apple.privateKey.export({ type: "pkcs8", format: "pem" }).toString(), { kid: "ABC123" }, { iss: "EQUIPE", iat: 1 });
  const [entete, contenu, signature] = jeton.split(".");
  assert.deepEqual(JSON.parse(Buffer.from(entete!, "base64url").toString()), { alg: "ES256", typ: "JWT", kid: "ABC123" });
  assert.deepEqual(JSON.parse(Buffer.from(contenu!, "base64url").toString()), { iss: "EQUIPE", iat: 1 });
  assert.equal(Buffer.from(signature!, "base64url").length, 64, "r‖s sur 64 octets");
  assert.ok(createVerify("SHA256").update(`${entete}.${contenu}`).verify({ key: apple.publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(signature!, "base64url")));
  const google = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jetonGoogle = signerJetonJwt("RS256", google.privateKey.export({ type: "pkcs8", format: "pem" }).toString(), {}, { iss: "compte@projet" });
  const [e, c, s] = jetonGoogle.split(".");
  assert.ok(createVerify("SHA256").update(`${e}.${c}`).verify(google.publicKey, Buffer.from(s!, "base64url")));
});

const appels: unknown[] = [];
const banc = await creerBancGestion({
  lireEtatPush: async () => ({ apple: "absent", google: "absent", iphone: 0, android: 0, programmees: 0 }),
  listerNotifications: async () => [],
  estimerPush: async (cible: unknown) => (appels.push({ estimer: cible }), { total: 10, iphone: 6, android: 4, antiSpam: 2 }),
  creerNotification: async (saisie: unknown) => (appels.push({ creer: saisie }), { id: 5 }),
  annulerNotification: async (id: number) => id === 5,
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("estimation : ville et plateforme lues (une plateforme inconnue = les deux)", async () => {
  await banc.demander("GET", "/notifications/estimation?ville=Lyon&plateforme=ios", { session });
  assert.deepEqual(appels.at(-1), { estimer: { ville: "Lyon", plateforme: "ios" } });
  await banc.demander("GET", "/notifications/estimation?plateforme=windows", { session });
  assert.deepEqual(appels.at(-1), { estimer: { ville: null, plateforme: null } });
});

test("création : titre et texte obligatoires, lien vers un écran de l'app seulement, programmation bornée", async () => {
  const base = { titre: "Ce soir, ça bouge 🛟", texte: "Trois lieux ont de la place : viens les sauver !" };
  assert.equal((await banc.demander("POST", "/notifications", { session, corps: { titre: "Sans texte" } })).status, 400);
  assert.equal((await banc.demander("POST", "/notifications", { session, corps: { ...base, lien: "https://mechant.example" } })).status, 400);
  assert.equal((await banc.demander("POST", "/notifications", { session, corps: { ...base, programmeeLe: "2099-01-01T00:00:00Z" } })).status, 400);
  const reponse = await banc.demander("POST", "/notifications", { session, corps: { ...base, lien: "/lieu/12", ville: "Lyon", plateforme: "android" } });
  assert.equal(reponse.status, 201);
  const { creer } = appels.at(-1) as { creer: { lien: string; cible: unknown; description: string; programmeeLe: Date } };
  assert.equal(creer.lien, "/lieu/12");
  assert.deepEqual(creer.cible, { ville: "Lyon", plateforme: "android" });
  assert.equal(creer.description, "À Lyon · Android");
});

test("annulation : seulement avant le départ", async () => {
  assert.equal((await banc.demander("POST", "/notifications/5/annuler", { session, corps: {} })).status, 200);
  assert.equal((await banc.demander("POST", "/notifications/6/annuler", { session, corps: {} })).status, 409);
});
