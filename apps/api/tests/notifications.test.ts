// Tests des notifications push : anti-spam, jetons signés pour Apple et Google, notifications d'un compte (seulement ses
// téléphones encore connectés), routes du logiciel de gestion.
import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { after, before, test } from "node:test";

import { depasseAntiSpam } from "../src/fonctions/notifications/depasse-anti-spam.ts";
import { signerJetonJwt } from "../src/fonctions/notifications/signer-jeton-jwt.ts";
import { construireCorpsGoogle, construireEnvoiApple } from "../src/services/notifications/expedier-push.ts";
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

test("regroupement et son (messagerie, lot L4) : une notification par conversation, la suivante sans son ; rien de changé sans eux", () => {
  const simple = { titre: "Ce soir, ça bouge 🛟", texte: "Trois lieux ont de la place.", lien: "/explorer" };
  const apple = construireEnvoiApple(simple);
  assert.deepEqual(apple.entetes, {});
  assert.deepEqual(JSON.parse(apple.corps), { aps: { alert: { title: simple.titre, body: simple.texte }, sound: "default" }, lien: "/explorer" });
  assert.deepEqual(construireCorpsGoogle("jeton-g", simple).message.android, { priority: "high" });
  const message = { titre: "💬 Léa", texte: "Nouveau message. Viens voir !", lien: "/potes/discussion/3", regroupement: "conversation:3", sonore: false };
  const groupe = construireEnvoiApple(message);
  assert.deepEqual(groupe.entetes, { "apns-collapse-id": "conversation:3" });
  assert.deepEqual(JSON.parse(groupe.corps).aps, { alert: { title: "💬 Léa", body: "Nouveau message. Viens voir !" }, "thread-id": "conversation:3" }, "sans son");
  assert.equal(JSON.parse(construireEnvoiApple({ ...message, sonore: true }).corps).aps.sound, "default");
  assert.deepEqual(construireCorpsGoogle("jeton-g", message), {
    message: {
      token: "jeton-g", notification: { title: "💬 Léa", body: "Nouveau message. Viens voir !" }, data: { lien: "/potes/discussion/3" },
      android: { priority: "high", notification: { tag: "conversation:3" } },
    },
  });
  // Au-delà de 64 octets, Apple refuserait l'en-tête : pas de regroupement, la notification part quand même
  assert.deepEqual(construireEnvoiApple({ ...message, regroupement: "x".repeat(65) }).entetes, {});
  const urgent = JSON.parse(construireEnvoiApple({ ...simple, urgent: true }).corps).aps;
  assert.equal(urgent["interruption-level"], "time-sensitive");
});

// prevenirCompte se branche sur la base au chargement, sans s'y connecter : une adresse d'essai suffit, la table est un double
process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { prevenirCompte } = await import("../src/services/notifications/prevenir-compte.ts");

type Telephone = { id: number; jeton: string; plateforme: string; compteId: number | null; sessionId: number | null; actif: boolean };
type FiltreTelephones = { actif: boolean; compteId: number; sessionId?: { not: null } };

/** Double de la table appareils_push : filtre comme la base (actif, compte, session encore ouverte) et note les désactivations */
function creerTableTelephones(telephones: Telephone[]) {
  const filtres: FiltreTelephones[] = [];
  const table = {
    findMany: async ({ where }: { where: FiltreTelephones }) => {
      filtres.push(where);
      return telephones
        .filter((t) => t.actif === where.actif && t.compteId === where.compteId && (where.sessionId === undefined || t.sessionId !== null))
        .map(({ id, jeton, plateforme }) => ({ id, jeton, plateforme }));
    },
    update: async ({ where, data }: { where: { id: number }; data: { actif: boolean } }) => {
      const telephone = telephones.find((t) => t.id === where.id);
      if (telephone) telephone.actif = data.actif;
    },
  };
  return { table: table as never, filtres };
}

const MESSAGE = { titre: "💬 Léa", texte: "Nouveau message. Viens voir !", lien: "/potes/discussion/3" };

test("prevenirCompte : seulement les téléphones actifs du compte inscrits avec une session encore ouverte", async () => {
  const { table, filtres } = creerTableTelephones([
    { id: 1, jeton: "connecte-ios", plateforme: "ios", compteId: 7, sessionId: 31, actif: true },
    { id: 2, jeton: "session-fermee", plateforme: "android", compteId: 7, sessionId: null, actif: true },
    { id: 3, jeton: "connecte-android", plateforme: "android", compteId: 7, sessionId: 32, actif: true },
    { id: 4, jeton: "desactive", plateforme: "ios", compteId: 7, sessionId: 33, actif: false },
    { id: 5, jeton: "autre-compte", plateforme: "ios", compteId: 8, sessionId: 34, actif: true },
  ]);
  const envois: string[] = [];
  await prevenirCompte(7, MESSAGE, async (appareil, message) => (envois.push(`${appareil.jeton}:${message.titre}`), "envoyee"), table);
  assert.deepEqual(envois.sort(), ["connecte-android:💬 Léa", "connecte-ios:💬 Léa"]);
  assert.deepEqual(filtres, [{ actif: true, compteId: 7, sessionId: { not: null } }]);
  // Un compte dont tous les téléphones sont déconnectés : rien ne part, sans erreur
  const vide = creerTableTelephones([{ id: 9, jeton: "prete-puis-deconnecte", plateforme: "ios", compteId: 12, sessionId: null, actif: true }]);
  await prevenirCompte(12, MESSAGE, async () => assert.fail("rien ne doit partir"), vide.table);
});

test("prevenirCompte : jeton mort désactivé ; erreur d'Apple ou de Google journalisée sans jeton ni texte", async (t) => {
  const telephones: Telephone[] = [
    { id: 1, jeton: "jeton-mort", plateforme: "ios", compteId: 7, sessionId: 31, actif: true },
    { id: 2, jeton: "jeton-boude", plateforme: "android", compteId: 7, sessionId: 32, actif: true },
  ];
  const { table } = creerTableTelephones(telephones);
  const journal = t.mock.method(console, "error", () => {});
  await prevenirCompte(7, MESSAGE, async (appareil) => (appareil.jeton === "jeton-mort" ? "jeton-invalide" : { erreur: "FCM 503 UNAVAILABLE" }), table);
  assert.deepEqual(telephones.map((tel) => tel.actif), [false, true]);
  assert.equal(journal.mock.callCount(), 1);
  const ecrit = JSON.stringify(journal.mock.calls[0]?.arguments);
  assert.ok(ecrit.includes("FCM 503 UNAVAILABLE"));
  for (const secret of ["jeton-mort", "jeton-boude", MESSAGE.texte, MESSAGE.titre]) assert.ok(!ecrit.includes(secret), `rien de « ${secret} » au journal`);
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
