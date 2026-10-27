import assert from "node:assert/strict";
import { createHash, randomBytes, webcrypto } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerCodeTotp } from "../src/fonctions/securite/calculer-code-totp.ts";
import { calculerIdPoste } from "../src/fonctions/securite/calculer-id-poste.ts";
import { construireMessageGestion } from "../src/fonctions/securite/construire-message-gestion.ts";
import { creerStockageSessionsEnMemoire } from "../src/middlewares/proteger-gestion.ts";
import type { AccesGestion, PosteAutorise } from "../src/services/gestion/acces.ts";
import { creerJetonCompteurs, DUREE_JETON_COMPTEURS } from "../src/services/gestion/jetons-compteurs.ts";
import { creerRegistrePostesDistanceEnMemoire } from "../src/services/gestion/postes-distance.ts";
import type { ServicesGestion } from "../src/services/gestion/tous-les-services.ts";

const { subtle } = webcrypto;
type Poste = { cles: webcrypto.CryptoKeyPair; brute: Uint8Array; id: string };
async function creerPoste(): Promise<Poste> {
  const cles = (await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as webcrypto.CryptoKeyPair;
  const brute = new Uint8Array(await subtle.exportKey("raw", cles.publicKey));
  return { cles, brute, id: calculerIdPoste(brute) };
}

const secretTotp = new Uint8Array(randomBytes(20));
let horloge = Date.now();
const principal = await creerPoste();
const passage = await creerPoste();
const posteDe = (poste: Poste, nom: string, expireLe: number | null): PosteAutorise => ({ id: poste.id, nom, clePublique: poste.brute, origine: "serveur", expireLe });
let acces: AccesGestion | null = { postes: [posteDe(principal, "PC de Hugo", null), posteDe(passage, "PC de la médiathèque", Date.now() + 12 * 3600_000)], secretTotp };
const journal: string[] = [];
const services = {
  noterAction: async (poste: string, action: string) => void journal.push(`${poste} | ${action}`),
  lireAlertes: async () => ({ moderation: { aTraiter: 2, urgents: 0, contestes: 0 }, actus: 3 }),
} as unknown as ServicesGestion;

let adresse = "";
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  gestion: { lireAcces: () => acces, services, horloge: () => horloge, sessions: creerStockageSessionsEnMemoire(), postesDistance: creerRegistrePostesDistanceEnMemoire() },
}).listen(0, "127.0.0.1");
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

async function demander(poste: Poste, methode: string, chemin: string, options: { corps?: unknown; session?: string } = {}) {
  const corps = options.corps === undefined ? "" : JSON.stringify(options.corps);
  const nonce = randomBytes(16).toString("base64url");
  const horodatage = String(horloge);
  const message = construireMessageGestion({
    methode, chemin, horodatage, nonce, session: options.session ?? null, empreinteCorps: createHash("sha256").update(corps).digest("hex"),
  });
  const signature = Buffer.from(await subtle.sign("Ed25519", poste.cles.privateKey, Buffer.from(message))).toString("base64url");
  return fetch(`${adresse}/api-gestion${chemin}`, {
    method: methode,
    headers: {
      "Content-Type": "application/json", "X-Gestion-Poste": poste.id, "X-Gestion-Horodatage": horodatage, "X-Gestion-Nonce": nonce,
      "X-Gestion-Signature": signature, ...(options.session ? { "X-Gestion-Session": options.session } : {}),
    },
    ...(corps ? { body: corps } : {}),
  });
}
async function ouvrirSession(poste: Poste) {
  horloge += 30_000;
  const reponse = await demander(poste, "POST", "/session", { corps: { code: calculerCodeTotp(secretTotp, Math.floor(horloge / 30_000)) } });
  assert.equal(reponse.status, 201);
  return ((await reponse.json()) as { session: string }).session;
}
const lireCompteurs = (jeton?: string) => fetch(`${adresse}/api-gestion/compteurs`, { headers: jeton === undefined ? {} : { "X-Gestion-Jeton": jeton } });
async function jetonDe(poste: Poste) {
  const reponse = await demander(poste, "POST", "/compteurs/jeton", { session: await ouvrirSession(poste) });
  return { statut: reponse.status, corps: (await reponse.json()) as { jeton?: string; erreur?: string } };
}

test("un PC autorisé obtient son jeton, puis lit les compteurs sans signature ni session", async () => {
  const { statut, corps } = await jetonDe(principal);
  assert.equal(statut, 200);
  assert.match(corps.jeton!, new RegExp(`^${principal.id}\\.\\d{13}\\.[A-Za-z0-9_-]{43}$`));
  assert.ok(journal.includes("PC de Hugo | Notifications avec le logiciel fermé activées"));
  horloge += 60_000;
  const lecture = await lireCompteurs(corps.jeton);
  assert.equal(lecture.status, 200);
  assert.deepEqual(await lecture.json(), { moderation: { aTraiter: 2, urgents: 0, contestes: 0 }, actus: 3 });
});

test("pas plus d'une lecture toutes les 20 secondes par PC", async () => {
  const { corps } = await jetonDe(principal);
  horloge += 60_000;
  assert.equal((await lireCompteurs(corps.jeton)).status, 200);
  horloge += 5_000;
  const tropTot = await lireCompteurs(corps.jeton);
  assert.equal(tropTot.status, 429);
  assert.equal(((await tropTot.json()) as { erreur: string }).erreur, "trop-tot");
  horloge += 20_000;
  assert.equal((await lireCompteurs(corps.jeton)).status, 200);
});

test("un PC de passage n'a pas de jeton", async () => {
  const { statut, corps } = await jetonDe(passage);
  assert.equal(statut, 409);
  assert.equal(corps.erreur, "poste-de-passage");
});

test("sans jeton, jeton abîmé, d'un autre secret ou d'un PC de passage : refusé", async () => {
  horloge += 60_000;
  const bon = creerJetonCompteurs(secretTotp, principal.id, horloge);
  const abime = `${bon.slice(0, -1)}${bon.endsWith("A") ? "B" : "A"}`;
  const autreSecret = creerJetonCompteurs(new Uint8Array(randomBytes(20)), principal.id, horloge);
  const dePassage = creerJetonCompteurs(secretTotp, passage.id, horloge);
  for (const jeton of [undefined, "", "n'importe quoi", abime, autreSecret, dePassage]) {
    const reponse = await lireCompteurs(jeton);
    assert.equal(reponse.status, 401, String(jeton));
    assert.equal(((await reponse.json()) as { erreur: string }).erreur, "non-autorise");
  }
});

test("jeton trop vieux ou daté du futur : refusé", async () => {
  horloge += 60_000;
  assert.equal((await lireCompteurs(creerJetonCompteurs(secretTotp, principal.id, horloge - DUREE_JETON_COMPTEURS - 1))).status, 401);
  assert.equal((await lireCompteurs(creerJetonCompteurs(secretTotp, principal.id, horloge + 5 * 60_000))).status, 401);
  assert.equal((await lireCompteurs(creerJetonCompteurs(secretTotp, principal.id, horloge - DUREE_JETON_COMPTEURS + 60_000))).status, 200);
});

test("PC retiré ou gestion fermée : le jeton ne sert plus à rien", async () => {
  horloge += 60_000;
  const jeton = creerJetonCompteurs(secretTotp, principal.id, horloge);
  const avant = acces;
  acces = { ...avant!, postes: avant!.postes.filter((p) => p.id !== principal.id) };
  assert.equal((await lireCompteurs(jeton)).status, 401);
  acces = null;
  assert.equal((await lireCompteurs(jeton)).status, 503);
  acces = avant;
  assert.equal((await lireCompteurs(jeton)).status, 200);
});

test("la fenêtre du logiciel peut envoyer l'en-tête du jeton (CORS)", async () => {
  const reponse = await fetch(`${adresse}/api-gestion/compteurs`, { method: "OPTIONS", headers: { Origin: "http://tauri.localhost" } });
  assert.equal(reponse.status, 204);
  assert.match(reponse.headers.get("access-control-allow-headers") ?? "", /X-Gestion-Jeton/);
});
