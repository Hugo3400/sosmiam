import assert from "node:assert/strict";
import { createDecipheriv, randomBytes } from "node:crypto";
import { test } from "node:test";

import { chiffrerApercuPush, CONTEXTE_APERCU_PUSH } from "../src/fonctions/notifications/chiffrer-apercu-push.ts";
import { ecrireApercuMessage } from "../src/fonctions/social/ecrire-apercu-message.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../src/services/chiffrement-social.ts";
import { creerApercusPush } from "../src/services/notifications/apercus-push.ts";
import { construireCorpsGoogle, construireDonneesGoogle, construireEnvoiApple, type MessagePush } from "../src/services/notifications/expedier-push.ts";

process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { prevenirCompteEtCompter } = await import("../src/services/notifications/prevenir-compte.ts");

const SECRET = "On se retrouve chez Bouiboui à 20 h 🍕";
const MESSAGE: MessagePush = {
  titre: "💬 Léa", texte: "Nouveau message. Viens voir !", lien: "/potes/discussion/3", regroupement: "conversation:3", categorie: "message",
  apercu: { titre: "💬 Léa", texte: SECRET },
};

function dechiffrer(apercu: string, cle: Uint8Array) {
  const octets = Buffer.from(apercu, "base64");
  const dechiffreur = createDecipheriv("aes-256-gcm", cle, octets.subarray(0, 12), { authTagLength: 16 });
  dechiffreur.setAAD(Buffer.from(CONTEXTE_APERCU_PUSH, "utf8"));
  dechiffreur.setAuthTag(octets.subarray(octets.length - 16));
  return JSON.parse(Buffer.concat([dechiffreur.update(octets.subarray(12, octets.length - 16)), dechiffreur.final()]).toString("utf8"));
}

test("chiffrerApercuPush : iv | chiffré | tag en base64, relu avec la clé du téléphone et le contexte ; iv neuf à chaque fois", () => {
  const cle = randomBytes(32);
  const un = chiffrerApercuPush({ titre: "💬 Léa", texte: SECRET }, cle);
  assert.deepEqual(dechiffrer(un, cle), { t: "💬 Léa", c: SECRET });
  assert.notEqual(chiffrerApercuPush({ titre: "💬 Léa", texte: SECRET }, cle), un);
  assert.ok(!Buffer.from(un, "base64").toString("utf8").includes("Bouiboui"));
  assert.throws(() => dechiffrer(un, randomBytes(32)), "une autre clé ne relit rien");
  assert.throws(() => chiffrerApercuPush({ titre: "a", texte: "b" }, randomBytes(16)));
});

test("creerApercusPush : la clé du téléphone gardée chiffrée, liée à son jeton ; sans clé des données : rien", () => {
  assert.equal(creerApercusPush(null), null);
  const apercus = creerApercusPush(creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32))))!;
  const cle = randomBytes(32);
  const gardee = apercus.garderCle(cle, "jeton-de-lea-0123456789");
  assert.match(gardee, /^v\d+:/);
  assert.ok(!gardee.includes(cle.toString("base64url")));
  const chiffre = apercus.chiffrerPour({ titre: "💬 Léa", texte: SECRET }, { jeton: "jeton-de-lea-0123456789", cleApercuChiffree: gardee });
  assert.deepEqual(dechiffrer(chiffre, cle), { t: "💬 Léa", c: SECRET });
  assert.throws(() => apercus.chiffrerPour({ titre: "x", texte: "y" }, { jeton: "un-autre-telephone-000", cleApercuChiffree: gardee }), "recopiée sur un autre téléphone : illisible");
  assert.throws(() => apercus.garderCle(randomBytes(31), "jeton-de-lea-0123456789"));
});

test("Apple : mutable-content, category et apercu à la racine seulement s'il est chiffré ; le texte en clair ne part jamais", () => {
  const clair = construireEnvoiApple(MESSAGE).corps;
  assert.ok(!clair.includes("Bouiboui"));
  assert.equal("mutable-content" in JSON.parse(clair).aps, false);
  assert.equal(JSON.parse(clair).aps.category, "message");
  const corps = JSON.parse(construireEnvoiApple({ ...MESSAGE, apercuChiffre: "Q0hJRkZSRQ==" }).corps);
  assert.deepEqual([corps.aps["mutable-content"], corps.apercu, corps.aps.alert.body], [1, "Q0hJRkZSRQ==", "Nouveau message. Viens voir !"]);
});

test("Google : avec un aperçu chiffré, des données seulement (title et message neutres pour le secours, canal, tag, pastille)", () => {
  assert.ok(!JSON.stringify(construireCorpsGoogle("jeton", MESSAGE)).includes("Bouiboui"));
  const donnees = construireDonneesGoogle("jeton", { ...MESSAGE, social: true, badge: 4 }, "Q0hJRkZSRQ==");
  assert.equal("notification" in donnees.message, false);
  assert.deepEqual(donnees.message.data, {
    title: "💬 Léa", message: "Nouveau message. Viens voir !", channelId: "messages", apercu: "Q0hJRkZSRQ==", vibrate: "true",
    lien: "/potes/discussion/3", tag: "conversation:3", categoryId: "message", badge: "4",
  });
  assert.deepEqual(donnees.message.android, { priority: "high" });
  assert.ok(!JSON.stringify(donnees).includes("Bouiboui"));
  const muette = construireDonneesGoogle("jeton", { ...MESSAGE, social: true, sonore: false }, "x");
  assert.deepEqual([muette.message.data.channelId, "vibrate" in muette.message.data], ["messages-discrets", false]);
});

test("prevenirCompte : l'aperçu chiffré pour chaque téléphone qui a sa clé, jamais en clair ; clé illisible : texte neutre", async (t) => {
  const apercus = creerApercusPush(creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32))))!;
  const cle = randomBytes(32);
  const telephones = [
    { id: 1, jeton: "iphone-avec-cle-000000", plateforme: "ios", cleApercuChiffree: apercus.garderCle(cle, "iphone-avec-cle-000000") },
    { id: 2, jeton: "android-sans-cle-00000", plateforme: "android", cleApercuChiffree: null },
    { id: 3, jeton: "iphone-cle-abimee-0000", plateforme: "ios", cleApercuChiffree: "v1:abime" },
  ];
  const table = { findMany: async () => telephones, update: async () => undefined } as never;
  const envois: { appareil: unknown; message: MessagePush }[] = [];
  const envoyer = async (appareil: unknown, message: MessagePush) => (envois.push({ appareil, message }), "envoyee" as const);
  const journal = t.mock.method(console, "error", () => {});
  assert.equal(await prevenirCompteEtCompter(7, MESSAGE, envoyer, table, null, apercus), 3);
  assert.deepEqual(dechiffrer(envois[0]!.message.apercuChiffre!, cle), { t: "💬 Léa", c: SECRET });
  assert.deepEqual(envois.map((e) => "apercuChiffre" in e.message), [true, false, false]);
  assert.ok(envois.every((e) => !("apercu" in e.message)), "l'aperçu en clair reste sur le serveur");
  assert.deepEqual(envois[1]!.appareil, { jeton: "android-sans-cle-00000", plateforme: "android" }, "la clé gardée ne sort pas");
  assert.ok(!JSON.stringify(envois).includes("Bouiboui"));
  assert.equal(journal.mock.callCount(), 1);
  assert.ok(!JSON.stringify(journal.mock.calls).includes("Bouiboui") && !JSON.stringify(journal.mock.calls).includes("abime"));
  envois.length = 0;
  await prevenirCompteEtCompter(7, MESSAGE, envoyer, table, null, null);
  assert.ok(envois.every((e) => !("apercu" in e.message) && !("apercuChiffre" in e.message)), "pas branché : texte neutre partout");
});

test("ecrireApercuMessage : le texte (coupé à 180), le mot d'un lieu, la légende d'une photo ; rien pour le reste", () => {
  const prive = { type: "prive" as const };
  const groupe = { type: "groupe" as const };
  assert.deepEqual(ecrireApercuMessage({ prenom: "Léa", type: "texte", texte: "  On  y va ?\n", titre: "💬 Léa", conversation: prive }), { titre: "💬 Léa", texte: "On y va ?" });
  assert.deepEqual(ecrireApercuMessage({ prenom: "Léa", type: "texte", texte: "On y va ?", titre: "💬 Les gourmands", conversation: groupe })?.texte, "Léa : On y va ?");
  assert.equal(ecrireApercuMessage({ prenom: "Léa", type: "lieu", texte: "Le meilleur kebab", titre: "t", conversation: prive })?.texte, "📍 Le meilleur kebab");
  assert.equal(ecrireApercuMessage({ prenom: "Léa", type: "photo", texte: "Regarde ça", titre: "t", conversation: groupe })?.texte, "Léa : 📷 Regarde ça");
  for (const type of ["gif", "vocal", "vote"]) assert.equal(ecrireApercuMessage({ prenom: "Léa", type, texte: "x", titre: "t", conversation: prive }), null);
  assert.equal(ecrireApercuMessage({ prenom: "Léa", type: "lieu", texte: null, titre: "t", conversation: prive }), null);
  assert.equal(ecrireApercuMessage({ prenom: "Léa", type: "texte", texte: "   ", titre: "t", conversation: prive }), null);
  const long = ecrireApercuMessage({ prenom: "Léa", type: "texte", texte: "🍕".repeat(400), titre: "t", conversation: prive })!.texte;
  assert.deepEqual([[...long].length, long.endsWith("…")], [180, true]);
});
