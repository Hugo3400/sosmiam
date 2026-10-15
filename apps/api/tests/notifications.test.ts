// Tests des notifications push : anti-spam, jetons signés pour Apple et Google, corps envoyés (regroupement, son, repère
// urgent, canal Android de chaque sorte de notification), notifications d'un compte (seulement ses téléphones encore
// connectés), routes du logiciel de gestion.
import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { after, before, test } from "node:test";

import { depasseAntiSpam } from "../src/fonctions/notifications/depasse-anti-spam.ts";
import { signerJetonJwt } from "../src/fonctions/notifications/signer-jeton-jwt.ts";
import { creerAppliquerEffetsSociaux } from "../src/controleurs/effets-sociaux.ts";
import { ecrirePushBande } from "../src/fonctions/social/ecrire-push-bande.ts";
import { ecrirePushGroupe } from "../src/fonctions/social/ecrire-push-groupe.ts";
import { ecrirePushMessage } from "../src/fonctions/social/ecrire-push-message.ts";
import { ecrirePushSortie } from "../src/fonctions/social/ecrire-push-sortie.ts";
import type { EffetSocial } from "../src/services/effets-sociaux-regles.ts";
import { construireCorpsGoogle, construireEnvoiApple, type MessagePush } from "../src/services/notifications/expedier-push.ts";
import { creerVisitesEnMemoire } from "../src/services/visites-en-memoire.ts";
import { creerVisitesGestion } from "../src/services/visites-gestion.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";
import { LIEU_TEST } from "./outils/creer-banc-visites.ts";

/** Android 7 (sans canaux) : son, vibration et priorité posés par le message, sauf pour la suite muette d'une rafale */
const SONNE_ANDROID_7 = { default_sound: true, default_vibrate_timings: true, notification_priority: "PRIORITY_HIGH" };
const URGENT_ANDROID_7 = { ...SONNE_ANDROID_7, notification_priority: "PRIORITY_MAX" };

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

test("regroupement et son (messagerie, lot L4) : une notification par conversation, la suivante sans son (canal muet sur Android) ; rien de changé sans eux", () => {
  const simple = { titre: "Ce soir, ça bouge 🛟", texte: "Trois lieux ont de la place.", lien: "/explorer" };
  const apple = construireEnvoiApple(simple);
  assert.deepEqual(apple.entetes, {});
  assert.deepEqual(JSON.parse(apple.corps), { aps: { alert: { title: simple.titre, body: simple.texte }, sound: "default" }, lien: "/explorer" });
  // Android : toujours un canal ; « notifications » pour ce qui n'est ni urgent, ni social
  assert.deepEqual(construireCorpsGoogle("jeton-g", simple).message.android, { priority: "high", notification: { channel_id: "notifications", ...SONNE_ANDROID_7 } });
  assert.deepEqual(construireCorpsGoogle("jeton-g", { ...simple, lien: null }).message.data, {}, "sans lien, data vide");
  const message = { titre: "💬 Léa", texte: "Nouveau message. Viens voir !", lien: "/potes/discussion/3", regroupement: "conversation:3", sonore: false, social: true };
  const groupe = construireEnvoiApple(message);
  assert.deepEqual(groupe.entetes, { "apns-collapse-id": "conversation:3" });
  assert.deepEqual(JSON.parse(groupe.corps), { aps: { alert: { title: "💬 Léa", body: "Nouveau message. Viens voir !" }, "thread-id": "conversation:3" }, lien: "/potes/discussion/3" }, "sans son, sans repère urgent");
  assert.equal(JSON.parse(construireEnvoiApple({ ...message, sonore: true }).corps).aps.sound, "default");
  // tag aussi dans data : app ouverte, expo en fait l'identifiant de la notification (le message suivant remplace le précédent)
  assert.deepEqual(construireCorpsGoogle("jeton-g", message), {
    message: {
      token: "jeton-g", notification: { title: "💬 Léa", body: "Nouveau message. Viens voir !" }, data: { lien: "/potes/discussion/3", tag: "conversation:3" },
      android: { priority: "high", notification: { tag: "conversation:3", channel_id: "messages-discrets" } },
    },
  });
  // Android : le message qui sonne part sur « messages », la suite d'une rafale sur le canal muet ; Miam Safe passe avant tout
  assert.deepEqual(construireCorpsGoogle("jeton-g", { ...message, sonore: true }).message.android, { priority: "high", notification: { tag: "conversation:3", channel_id: "messages", ...SONNE_ANDROID_7 } });
  assert.deepEqual(construireCorpsGoogle("jeton-g", { ...simple, sonore: false }).message.android, { priority: "high", notification: { channel_id: "messages-discrets" } });
  assert.deepEqual(construireCorpsGoogle("jeton-g", { ...simple, urgent: true, sonore: false, social: true }).message.android, { priority: "high", notification: { channel_id: "miam-safe", ...URGENT_ANDROID_7 } });
  // Au-delà de 64 octets, Apple refuserait l'en-tête : pas de regroupement, la notification part quand même (ni tag chez Google)
  assert.deepEqual(construireEnvoiApple({ ...message, regroupement: "x".repeat(65) }).entetes, {});
  assert.deepEqual(construireCorpsGoogle("jeton-g", { ...message, regroupement: "x".repeat(65) }).message.data, { lien: "/potes/discussion/3" });
});

test("repère urgent : urgent: \"1\" à la racine du message APNs et dans data chez Google, seulement pour une alerte urgente", () => {
  const alerte = { titre: "🛡 Léa a besoin d'aide", texte: "Au bar.", lien: "/pro/comptoir", urgent: true };
  assert.deepEqual(JSON.parse(construireEnvoiApple(alerte).corps), {
    aps: { alert: { title: alerte.titre, body: alerte.texte }, sound: "default", "interruption-level": "time-sensitive" },
    lien: "/pro/comptoir", urgent: "1",
  });
  assert.deepEqual(construireCorpsGoogle("jeton-g", alerte), {
    message: {
      token: "jeton-g", notification: { title: alerte.titre, body: alerte.texte }, data: { lien: "/pro/comptoir", urgent: "1" },
      android: { priority: "high", notification: { channel_id: "miam-safe", ...URGENT_ANDROID_7 } },
    },
  });
  // Même lien, sans urgent (une future notification pro vers le comptoir) : aucun repère, canal « notifications »
  const pro = { titre: "Ton comptoir", texte: "Trois visites à valider.", lien: "/pro/comptoir" };
  assert.equal(JSON.parse(construireEnvoiApple(pro).corps).urgent, undefined);
  assert.deepEqual(construireCorpsGoogle("jeton-g", pro).message.data, { lien: "/pro/comptoir" });
  assert.equal(construireCorpsGoogle("jeton-g", pro).message.android.notification.channel_id, "notifications");
});

test("canaux Android : chaque push sociale passe par l'applicateur et part sur « messages » ; une campagne ou une visite revue sur « notifications »", async () => {
  const envois: MessagePush[] = [];
  const appliquer = creerAppliquerEffetsSociaux({
    cloche: { noter: async () => {} },
    prevenirCompte: async (_compteId, message) => void envois.push(message),
    horloge: () => Date.parse("2026-10-15T20:00:00Z"),
  });
  const conversation = { id: 4, type: "prive" as const, titre: null };
  const sociales: EffetSocial[] = [
    { quoi: "push", compteId: 1, sorte: "message", message: ecrirePushMessage({ prenom: "Léa", type: "texte", conversation }) },
    { quoi: "push", compteId: 1, sorte: "message", message: ecrirePushMessage({ prenom: "Léa", type: "photo", conversation }) },
    { quoi: "push", compteId: 2, sorte: "bande-ajout", message: ecrirePushBande({ sorte: "bande-ajout", prenom: "Léa", idPublic: "abcdefghjk" }) },
    { quoi: "push", compteId: 3, sorte: "bande-acceptee", message: ecrirePushBande({ sorte: "bande-acceptee", prenom: "Léa", idPublic: "abcdefghjk" }) },
    { quoi: "push", compteId: 4, sorte: "invitation-sortie", message: ecrirePushSortie({ quoi: "invitation", prenom: "Léa", titre: "Pizza du jeudi", sortieId: 7 }) },
    { quoi: "push", compteId: 5, sorte: "sortie-lieu-choisi", message: ecrirePushSortie({ quoi: "lieu-choisi", titre: "Pizza du jeudi", lieu: "Chez Mo", sortieId: 7 }) },
    { quoi: "push", compteId: 6, sorte: "invitation-groupe", message: ecrirePushGroupe({ prenom: "Léa", titre: "Les Miamis" }) },
  ];
  await appliquer(sociales);
  await new Promise<void>((fini) => setImmediate(() => setImmediate(fini)));
  const canal = (m: MessagePush) => construireCorpsGoogle("jeton-g", m).message.android.notification.channel_id;
  assert.ok(envois.every((m) => m.social === true), "toutes marquées social par l'applicateur");
  assert.deepEqual(envois.map((m) => [m.titre, canal(m)]), [
    ["💬 Léa", "messages"],
    ["💬 Léa", "messages-discrets"],
    ["🤝 Léa a rejoint ta bande", "messages"],
    ["🤝 Léa a dit oui", "messages"],
    ["🎉 Léa t'invite : Pizza du jeudi", "messages"],
    ["🗳️ C'est voté !", "messages"],
    ["💬 Léa t'invite dans un groupe", "messages"],
  ]);
  // Les rédacteurs eux-mêmes ne posent jamais social : seul l'applicateur le fait
  assert.ok(sociales.every((e) => e.quoi === "push" && e.message.social === undefined));

  // Une campagne du logiciel : le message que file-push.ts envoie (titre, texte, lien de la notification programmée)
  assert.equal(canal({ titre: "Ce soir, ça bouge 🛟", texte: "Trois lieux ont de la place.", lien: "/explorer" }), "notifications");
  // Une visite revue par l'équipe (« Donner raison au client ») : prévenue par visites-gestion.ts
  const memoire = creerVisitesEnMemoire();
  memoire.lieux.set(1, { ...LIEU_TEST });
  memoire.comptes.set(7, { id: 7, prenom: "Léa", avatar: "🦊", nomChiffre: null, emailVerifie: true, rattachements: [] });
  const prevenus: MessagePush[] = [];
  const gestion = creerVisitesGestion({ depot: memoire.depot, ajouterPoints: async () => {}, prevenirCompte: async (_compteId, m) => void prevenus.push(m) });
  const T0 = new Date("2026-10-09T18:00:00Z");
  const { id } = await memoire.depot.ecrire((t) => t.creerVisite({
    compteId: 7, lieuId: 1, mode: "addition", statut: "refusee", code: "1234", creeLe: T0, expireLe: new Date(T0.getTime() + 1_800_000), valideLe: null,
    decideLe: T0, decideParId: 42, pendantSos: false, points: 0, tampon: false, resultatPosition: "dans-rayon", motifRefus: "pas-venu", contestee: true,
    contestation: null, avisOuvertLe: null, avisFermeLe: null, avisDonne: false, presentationId: null, reservationId: null, annulableJusqua: null, reglement: null,
  }));
  assert.equal((await gestion.donnerRaisonAuClient(id, new Date("2026-10-11T10:00:00Z"))).ok, true);
  assert.equal(prevenus.length, 1);
  assert.equal(canal(prevenus[0]!), "notifications");
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
