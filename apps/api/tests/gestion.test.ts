// Tests de la protection du logiciel de gestion : signature, rejeu, code à 6 chiffres, session. Faux services, sans base.
import assert from "node:assert/strict";
import { createHash, randomBytes, webcrypto } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerCodeTotp } from "../src/fonctions/securite/calculer-code-totp.ts";
import { calculerIdPoste } from "../src/fonctions/securite/calculer-id-poste.ts";
import { construireMessageGestion } from "../src/fonctions/securite/construire-message-gestion.ts";
import type { AccesGestion } from "../src/services/gestion/acces.ts";
import type { ServicesGestion } from "../src/services/gestion/tous-les-services.ts";

const { subtle } = webcrypto;
const secretTotp = new Uint8Array(randomBytes(20));
let horloge = Date.now();
const cles = (await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as webcrypto.CryptoKeyPair;
const clePublique = new Uint8Array(await subtle.exportKey("raw", cles.publicKey));
const autreCle = (await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as webcrypto.CryptoKeyPair;
const idPoste = calculerIdPoste(clePublique);
let acces: AccesGestion | null = { postes: [{ id: idPoste, nom: "PC de test", clePublique }], secretTotp };

const actions: string[] = [];
const services = {
  noterAction: async (_poste: string, action: string) => void actions.push(action),
  lireTableauDeBord: async () => ({ bonjour: "Hugo" }),
  creerBrouillon: async (saisie: { objet: string; texte: string }) => ({ id: 1, ...saisie }),
} as unknown as ServicesGestion;

let adresse = "";
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  gestion: { lireAcces: () => acces, services, horloge: () => horloge },
}).listen(0, "127.0.0.1");
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

type Options = { session?: string | null; corps?: string; cle?: webcrypto.CryptoKey; nonce?: string; horodatage?: number; falsifier?: boolean };
async function demander(methode: string, chemin: string, options: Options = {}) {
  const corps = options.corps ?? "";
  const nonce = options.nonce ?? randomBytes(16).toString("base64url");
  const horodatage = String(options.horodatage ?? horloge);
  const message = construireMessageGestion({
    methode, chemin, horodatage, nonce, session: options.session ?? null,
    empreinteCorps: createHash("sha256").update(corps).digest("hex"),
  });
  const signature = Buffer.from(await subtle.sign("Ed25519", options.cle ?? cles.privateKey, Buffer.from(message))).toString("base64url");
  return fetch(`${adresse}/api-gestion${chemin}`, {
    method: methode,
    headers: {
      "Content-Type": "application/json",
      "X-Gestion-Poste": idPoste,
      "X-Gestion-Horodatage": horodatage,
      "X-Gestion-Nonce": nonce,
      "X-Gestion-Signature": signature,
      ...(options.session ? { "X-Gestion-Session": options.session } : {}),
    },
    ...(corps ? { body: options.falsifier ? corps.replace("a", "b") : corps } : {}),
  });
}
const codeActuel = () => calculerCodeTotp(secretTotp, Math.floor(horloge / 30_000));
async function ouvrirSession() {
  horloge += 30_000; // un code ne sert qu'une fois : on passe au pas suivant
  const reponse = await demander("POST", "/session", { corps: JSON.stringify({ code: codeActuel() }) });
  assert.equal(reponse.status, 201);
  return ((await reponse.json()) as { session: string }).session;
}

test("le message signé a toujours la même forme (même exemple que le logiciel)", () => {
  assert.equal(
    construireMessageGestion({ methode: "get", chemin: "/lieux?statut=publie", horodatage: "1791460800000", nonce: "abcdefghijklmnop", session: null, empreinteCorps: "e3b0" }),
    "SOSMIAM-GESTION-1\nGET\n/lieux?statut=publie\n1791460800000\nabcdefghijklmnop\n-\ne3b0",
  );
});

test("le code à 6 chiffres suit la RFC 6238 (exemple officiel)", () => {
  assert.equal(calculerCodeTotp(new TextEncoder().encode("12345678901234567890"), Math.floor(59 / 30)), "287082");
});

test("sans signature, ou signé par une autre clé : refusé", async () => {
  assert.equal((await fetch(`${adresse}/api-gestion/tableau-de-bord`)).status, 401);
  assert.equal((await demander("GET", "/tableau-de-bord", { cle: autreCle.privateKey })).status, 401);
});

test("signé mais sans session : il faut d'abord le code", async () => {
  const reponse = await demander("GET", "/tableau-de-bord");
  assert.equal(reponse.status, 401);
  assert.deepEqual(await reponse.json(), { ok: false, erreur: "session-expiree" });
});

test("un mauvais code est refusé, le bon ouvre une session qui donne accès", async () => {
  horloge += 30_000;
  const mauvais = await demander("POST", "/session", { corps: JSON.stringify({ code: codeActuel() === "000000" ? "111111" : "000000" }) });
  assert.equal(mauvais.status, 401);
  const session = await ouvrirSession();
  const reponse = await demander("GET", "/tableau-de-bord", { session });
  assert.equal(reponse.status, 200);
  assert.deepEqual(await reponse.json(), { bonjour: "Hugo" });
});

test("un même code ne sert pas deux fois", async () => {
  await ouvrirSession();
  const encore = await demander("POST", "/session", { corps: JSON.stringify({ code: codeActuel() }) });
  assert.equal(encore.status, 401);
});

test("une demande rejouée, falsifiée ou trop vieille est refusée", async () => {
  const session = await ouvrirSession();
  const nonce = randomBytes(16).toString("base64url");
  assert.equal((await demander("GET", "/tableau-de-bord", { session, nonce })).status, 200);
  assert.equal((await demander("GET", "/tableau-de-bord", { session, nonce })).status, 401);
  const corps = JSON.stringify({ objet: "La newsletter", texte: "Salut" });
  assert.equal((await demander("POST", "/newsletter/brouillons", { session, corps, falsifier: true })).status, 401);
  assert.equal((await demander("POST", "/newsletter/brouillons", { session, corps })).status, 201);
  assert.ok(actions.includes("Newsletter créée"));
  assert.equal((await demander("GET", "/tableau-de-bord", { session, horodatage: horloge - 5 * 60_000 })).status, 401);
});

test("une session s'éteint après 2 heures sans activité", async () => {
  const session = await ouvrirSession();
  horloge += 2 * 3600_000 + 1000;
  const reponse = await demander("GET", "/tableau-de-bord", { session });
  assert.equal(reponse.status, 401);
});

test("un poste retiré du fichier d'accès est coupé aussitôt, et sans fichier tout est fermé", async () => {
  const session = await ouvrirSession();
  const sauvegarde = acces;
  acces = { postes: [], secretTotp };
  assert.equal((await demander("GET", "/tableau-de-bord", { session })).status, 401);
  acces = null;
  assert.equal((await demander("GET", "/tableau-de-bord", { session })).status, 503);
  acces = sauvegarde;
});

test("la fenêtre du logiciel peut appeler l'API (CORS), pas un autre site", async () => {
  const tauri = await fetch(`${adresse}/api-gestion/tableau-de-bord`, { method: "OPTIONS", headers: { Origin: "http://tauri.localhost" } });
  assert.equal(tauri.status, 204);
  assert.equal(tauri.headers.get("access-control-allow-origin"), "http://tauri.localhost");
  const autre = await fetch(`${adresse}/api-gestion/tableau-de-bord`, { method: "OPTIONS", headers: { Origin: "https://exemple.fr" } });
  assert.equal(autre.headers.get("access-control-allow-origin"), null);
});

test("un inconnu qui insiste ne bloque pas le poste de Hugo", async () => {
  for (let i = 0; i < 40; i++) {
    await fetch(`${adresse}/api-gestion/tableau-de-bord`, { headers: { "X-Gestion-Poste": "inconnu", "X-Gestion-Horodatage": String(horloge) } });
  }
  const session = await ouvrirSession();
  assert.equal((await demander("GET", "/tableau-de-bord", { session })).status, 200);
});

test("rien de la gestion ne reste en cache", async () => {
  const session = await ouvrirSession();
  const reponse = await demander("GET", "/tableau-de-bord", { session });
  assert.equal(reponse.headers.get("cache-control"), "private, no-store");
});

test("mises à jour : le jeton s'obtient connecté, et ouvre le manifeste ; sans jeton, rien", async () => {
  const session = await ouvrirSession();
  const { jeton } = (await (await demander("GET", "/maj/jeton", { session })).json()) as { jeton: string };
  assert.equal((await fetch(`${adresse}/api-gestion/maj/latest.json`)).status, 401);
  assert.equal((await fetch(`${adresse}/api-gestion/maj/latest.json`, { headers: { "X-Jeton-Maj": "123.faux" } })).status, 401);
  const avecJeton = await fetch(`${adresse}/api-gestion/maj/latest.json`, { headers: { "X-Jeton-Maj": jeton } });
  assert.ok([200, 204].includes(avecJeton.status));
  assert.equal((await fetch(`${adresse}/api-gestion/maj/fichiers/..%2F..%2Fetc%2Fpasswd`, { headers: { "X-Jeton-Maj": jeton } })).status, 404);
});
