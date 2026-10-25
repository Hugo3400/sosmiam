import assert from "node:assert/strict";
import { test } from "node:test";

import type { Langue } from "../../../packages/commun/src/regles/langues.ts";
import type { MessagePush } from "../src/services/notifications/expedier-push.ts";

process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { prevenirCompte, prevenirCompteEtCompter } = await import("../src/services/notifications/prevenir-compte.ts");

type Telephone = { id: number; jeton: string; plateforme: string; langue?: string; cleApercuChiffree?: string | null };

function table(telephones: Telephone[]) {
  const selections: unknown[] = [];
  const double = {
    findMany: async ({ select }: { select: unknown }) => (selections.push(select), telephones),
    update: async () => undefined,
  };
  return { table: double as never, selections };
}

const TEXTES: Record<Langue, { titre: string; texte: string }> = {
  fr: { titre: "💬 Léa", texte: "Nouveau message. Viens voir !" },
  en: { titre: "💬 Léa", texte: "New message. Come and see!" },
};

function creerRedacteur() {
  const appels: Langue[] = [];
  const rediger = (langue: Langue): MessagePush => (appels.push(langue), { ...TEXTES[langue], lien: "/potes/discussion/3" });
  return { rediger, appels };
}

function creerEnvoi() {
  const envois: { jeton: string; message: MessagePush }[] = [];
  const envoyer = async (appareil: { jeton: string }, message: MessagePush) => (envois.push({ jeton: appareil.jeton, message }), "envoyee" as const);
  return { envois, envoyer };
}

test("rédacteur : chaque téléphone reçoit le texte de sa propre langue, rédigé une seule fois par langue", async () => {
  const { table: telephones, selections } = table([
    { id: 1, jeton: "iphone-fr", plateforme: "ios", langue: "fr" },
    { id: 2, jeton: "android-en", plateforme: "android", langue: "en" },
    { id: 3, jeton: "ipad-en", plateforme: "ios", langue: "en" },
    { id: 4, jeton: "android-fr", plateforme: "android", langue: "fr" },
  ]);
  const { rediger, appels } = creerRedacteur();
  const { envois, envoyer } = creerEnvoi();
  assert.equal(await prevenirCompteEtCompter(7, rediger, envoyer, telephones, null, null), 4);
  assert.deepEqual(Object.fromEntries(envois.map((e) => [e.jeton, e.message.texte])), {
    "iphone-fr": TEXTES.fr.texte, "android-en": TEXTES.en.texte, "ipad-en": TEXTES.en.texte, "android-fr": TEXTES.fr.texte,
  });
  assert.deepEqual(appels.sort(), ["en", "fr"]);
  assert.equal((selections[0] as Record<string, unknown>).langue, true);
});

test("rédacteur : langue absente ou illisible en base, c'est le français ; aucun téléphone, rien n'est rédigé", async () => {
  const { table: telephones } = table([
    { id: 1, jeton: "sans-langue", plateforme: "ios" },
    { id: 2, jeton: "langue-abimee", plateforme: "android", langue: "xx" },
    { id: 3, jeton: "region", plateforme: "android", langue: "en-GB" },
  ]);
  const { rediger, appels } = creerRedacteur();
  const { envois, envoyer } = creerEnvoi();
  await prevenirCompte(7, rediger, envoyer, telephones, null, null);
  assert.deepEqual(Object.fromEntries(envois.map((e) => [e.jeton, e.message.texte])), {
    "sans-langue": TEXTES.fr.texte, "langue-abimee": TEXTES.fr.texte, region: TEXTES.en.texte,
  });
  const vide = creerRedacteur();
  assert.equal(await prevenirCompteEtCompter(7, vide.rediger, envoyer, table([]).table, null, null), 0);
  assert.deepEqual(vide.appels, []);
});

test("message tout fait : le même pour tous les téléphones, quelle que soit leur langue", async () => {
  const { table: telephones } = table([
    { id: 1, jeton: "fr", plateforme: "ios", langue: "fr" },
    { id: 2, jeton: "en", plateforme: "android", langue: "en" },
  ]);
  const { envois, envoyer } = creerEnvoi();
  const message: MessagePush = { titre: "SOS Miam", texte: "Ta visite est validée.", lien: "/visites" };
  await prevenirCompte(7, message, envoyer, telephones, null, null);
  assert.deepEqual(envois.map((e) => e.message), [message, message]);
});

test("rédacteur et pastille : lue une fois pour le compte, posée seulement là où le téléphone a sa clé ; celle du rédacteur gardée", async () => {
  const { table: telephones } = table([
    { id: 1, jeton: "cle-fr", plateforme: "ios", langue: "fr", cleApercuChiffree: "v1:a" },
    { id: 2, jeton: "cle-en", plateforme: "android", langue: "en", cleApercuChiffree: "v1:b" },
    { id: 3, jeton: "sans-cle-en", plateforme: "ios", langue: "en", cleApercuChiffree: null },
  ]);
  const { rediger } = creerRedacteur();
  let lectures = 0;
  const lire = async () => (lectures += 1, 5);
  const premier = creerEnvoi();
  await prevenirCompteEtCompter(7, rediger, premier.envoyer, telephones, lire, null);
  assert.deepEqual(Object.fromEntries(premier.envois.map((e) => [e.jeton, e.message.badge])), { "cle-fr": 5, "cle-en": 5, "sans-cle-en": undefined });
  assert.equal(lectures, 1);
  const second = creerEnvoi();
  await prevenirCompteEtCompter(7, (langue) => ({ ...rediger(langue), badge: 0 }), second.envoyer, telephones, lire, null);
  assert.deepEqual(Object.fromEntries(second.envois.map((e) => [e.jeton, e.message.badge])), { "cle-fr": 0, "cle-en": 0, "sans-cle-en": undefined });
  assert.equal(lectures, 1);
});
