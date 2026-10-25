import assert from "node:assert/strict";
import { createHash, randomBytes, webcrypto } from "node:crypto";
import { chmodSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerCodeTotp } from "../src/fonctions/securite/calculer-code-totp.ts";
import { calculerIdPoste } from "../src/fonctions/securite/calculer-id-poste.ts";
import { construireMessageGestion } from "../src/fonctions/securite/construire-message-gestion.ts";
import { fusionnerAccesGestion } from "../src/fonctions/securite/fusionner-acces-gestion.ts";
import { hacherMotDePasse } from "../src/fonctions/securite/hacher-mot-de-passe.ts";
import type { AlerteAccesDistance } from "../src/middlewares/autoriser-poste-distance.ts";
import { creerStockageSessionsEnMemoire } from "../src/middlewares/proteger-gestion.ts";
import type { AccesGestion } from "../src/services/gestion/acces.ts";
import {
  creerRegistrePostesDistance, creerRegistrePostesDistanceEnMemoire, lireFichierPostesDistance,
} from "../src/services/gestion/postes-distance.ts";
import type { ServicesGestion } from "../src/services/gestion/tous-les-services.ts";

const { subtle } = webcrypto;
type Poste = { cles: webcrypto.CryptoKeyPair; clePublique: string; id: string };
async function creerPoste(): Promise<Poste> {
  const cles = (await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as webcrypto.CryptoKeyPair;
  const brute = new Uint8Array(await subtle.exportKey("raw", cles.publicKey));
  return { cles, clePublique: Buffer.from(brute).toString("base64url"), id: calculerIdPoste(brute) };
}

const MOT_DE_PASSE = "une phrase de gestion bien longue";
const secretTotp = new Uint8Array(randomBytes(20));
let horloge = Date.now();
const principal = await creerPoste();
const distance = { empreinteMotDePasse: await hacherMotDePasse(MOT_DE_PASSE), courriel: "hugo@exemple.test" };
let acces: AccesGestion | null = {
  postes: [{ id: principal.id, nom: "PC de Hugo", clePublique: new Uint8Array(Buffer.from(principal.clePublique, "base64url")), origine: "serveur" }],
  secretTotp,
  distance,
};
const registre = creerRegistrePostesDistanceEnMemoire();
const alertes: AlerteAccesDistance[] = [];
const services = {
  noterAction: async () => {},
  prevenirAccesDistance: async (_courriel: string, alerte: AlerteAccesDistance) => void alertes.push(alerte),
} as unknown as ServicesGestion;

let adresse = "";
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  gestion: { lireAcces: () => acces, services, horloge: () => horloge, sessions: creerStockageSessionsEnMemoire(), postesDistance: registre },
}).listen(0, "127.0.0.1");
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

async function demander(poste: Poste, methode: string, chemin: string, options: { corps?: unknown; session?: string; signataire?: Poste } = {}) {
  const corps = options.corps === undefined ? "" : JSON.stringify(options.corps);
  const nonce = randomBytes(16).toString("base64url");
  const horodatage = String(horloge);
  const message = construireMessageGestion({
    methode, chemin, horodatage, nonce, session: options.session ?? null, empreinteCorps: createHash("sha256").update(corps).digest("hex"),
  });
  const cle = (options.signataire ?? poste).cles.privateKey;
  const signature = Buffer.from(await subtle.sign("Ed25519", cle, Buffer.from(message))).toString("base64url");
  return fetch(`${adresse}/api-gestion${chemin}`, {
    method: methode,
    headers: {
      "Content-Type": "application/json", "X-Gestion-Poste": poste.id, "X-Gestion-Horodatage": horodatage, "X-Gestion-Nonce": nonce,
      "X-Gestion-Signature": signature, ...(options.session ? { "X-Gestion-Session": options.session } : {}),
    },
    ...(corps ? { body: corps } : {}),
  });
}
const codeSuivant = () => {
  horloge += 30_000;
  return calculerCodeTotp(secretTotp, Math.floor(horloge / 30_000));
};
const demandeDistance = (poste: Poste, saisie: Partial<{ nom: string; duree: string; motDePasse: string; code: string }> = {}) => ({
  clePublique: poste.clePublique, nom: "PC de la médiathèque", duree: "passage", motDePasse: MOT_DE_PASSE, ...saisie, code: saisie.code ?? codeSuivant(),
});
async function autoriser(poste: Poste, saisie: Parameters<typeof demandeDistance>[1] = {}) {
  const reponse = await demander(poste, "POST", "/postes/distance", { corps: demandeDistance(poste, saisie) });
  return { statut: reponse.status, corps: (await reponse.json()) as { session?: string; erreur?: string; expireLe?: string | null; poste?: string } };
}
async function sessionPrincipale() {
  const reponse = await demander(principal, "POST", "/session", { corps: { code: codeSuivant() } });
  assert.equal(reponse.status, 201);
  return ((await reponse.json()) as { session: string }).session;
}

test("accès à distance pas réglé : refusé, sans rien écrire", async () => {
  const avant = acces;
  acces = { ...acces!, distance: null };
  const nouveau = await creerPoste();
  assert.deepEqual((await autoriser(nouveau)).corps.erreur, "distance-fermee");
  assert.equal(registre.lire()?.postes.length, 0);
  acces = avant;
});

test("bon mot de passe et bon code : PC autorisé 12 h, session ouverte et mail d'alerte", async () => {
  const passage = await creerPoste();
  const { statut, corps } = await autoriser(passage, { nom: "PC\u0007 de   la\nmédiathèque" });
  assert.equal(statut, 201);
  assert.equal(corps.poste, "PC de la médiathèque");
  assert.equal(Date.parse(corps.expireLe!), horloge + 12 * 3600_000);
  const session = await demander(passage, "GET", "/session", { session: corps.session });
  assert.equal(session.status, 200);
  assert.equal(((await session.json()) as { expireLe: string }).expireLe, corps.expireLe);
  const derniere = alertes.at(-1);
  assert.equal(derniere?.type === "nouveau-poste" ? derniere.nom : null, "PC de la médiathèque");

  horloge += 12 * 3600_000;
  const finie = await demander(passage, "GET", "/session", { session: corps.session });
  assert.equal(finie.status, 401);
  assert.equal(((await finie.json()) as { erreur: string }).erreur, "non-autorise");
});

test("mauvais mot de passe, mauvais code, code déjà servi ou autre signature : refusés", async () => {
  const intrus = await creerPoste();
  assert.equal((await autoriser(intrus, { motDePasse: "pas le bon" })).corps.erreur, "acces-distance-refuse");
  assert.equal((await autoriser(intrus, { code: "000000" })).corps.erreur, "acces-distance-refuse");
  const code = codeSuivant();
  assert.equal((await autoriser(intrus, { code })).statut, 201);
  const autre = await creerPoste();
  assert.equal((await demander(autre, "POST", "/postes/distance", { corps: { ...demandeDistance(autre), code } })).status, 401);
  const reponse = await demander(autre, "POST", "/postes/distance", { corps: demandeDistance(autre), signataire: intrus });
  assert.equal(((await reponse.json()) as { erreur: string }).erreur, "non-autorise");
});

test("liste des PC, PC coupé depuis le PC principal : refusé aussitôt et pour de bon", async () => {
  const passage = await creerPoste();
  const { corps } = await autoriser(passage, { duree: "semaine", nom: "PC de Léa" });
  const session = await sessionPrincipale();
  const liste = (await (await demander(principal, "GET", "/postes", { session })).json()) as { distanceOuverte: boolean; postes: { id: string; origine: string; cePoste: boolean }[] };
  assert.equal(liste.distanceOuverte, true);
  assert.deepEqual(liste.postes.find((p) => p.id === passage.id)?.origine, "distance");
  assert.equal(liste.postes.find((p) => p.id === principal.id)?.cePoste, true);

  assert.equal((await demander(principal, "DELETE", `/postes/${principal.id}`, { session })).status, 409);
  assert.equal((await demander(principal, "DELETE", `/postes/${passage.id}`, { session })).status, 200);
  assert.equal((await demander(passage, "GET", "/session", { session: corps.session })).status, 401);
  assert.equal((await autoriser(passage)).corps.erreur, "poste-coupe");
});

test("un PC de passage peut partir tout seul ; 5 PC à distance au plus", async () => {
  const passage = await creerPoste();
  const { corps } = await autoriser(passage);
  assert.equal((await demander(passage, "DELETE", `/postes/${passage.id}`, { session: corps.session })).status, 200);
  assert.equal((await demander(passage, "GET", "/session", { session: corps.session })).status, 401);

  const actifs = registre.lire()!.postes.filter((p) => p.expireLe === null || Date.parse(p.expireLe) > horloge).length;
  for (let i = actifs; i < 5; i++) assert.equal((await autoriser(await creerPoste(), { duree: "toujours" })).statut, 201);
  assert.equal((await autoriser(await creerPoste())).corps.erreur, "trop-de-postes");
});

test("pas plus de 2 vérifications de mot de passe à la fois : les suivantes attendent leur tour ailleurs", async () => {
  horloge += 3600_000;
  const intrus = await creerPoste();
  const statuts = await Promise.all(Array.from({ length: 6 }, (_, i) => autoriser(intrus, { motDePasse: `simultane ${i}`, code: "000000" }).then((r) => r.statut)));
  assert.deepEqual(statuts.filter((statut) => statut === 401).length, 2);
  assert.deepEqual(statuts.filter((statut) => statut === 503).length, 4);
});

test("10 essais ratés en une heure : ajout bloqué une heure, et un seul mail", async () => {
  horloge += 3600_000;
  const intrus = await creerPoste();
  const avant = alertes.length;
  for (let i = 0; i < 10; i++) assert.equal((await autoriser(intrus, { motDePasse: `essai ${i}` })).statut, 401);
  assert.equal((await autoriser(intrus)).statut, 429);
  assert.equal((await autoriser(intrus, { motDePasse: "encore" })).statut, 429);
  assert.deepEqual(alertes.slice(avant).map((a) => a.type), ["bloque"]);
  assert.equal((await demander(principal, "POST", "/session", { corps: { code: codeSuivant() } })).status, 201);
  horloge += 3600_000;
  assert.notEqual((await autoriser(intrus)).statut, 429);
});

test("fusion des accès : postes coupés cachés, expirés retirés, fichier illisible = tout fermé", () => {
  const base: AccesGestion = { postes: [{ id: "a", nom: "A", clePublique: new Uint8Array(32), origine: "serveur" }], secretTotp, distance: null };
  const cle = Buffer.alloc(32, 1).toString("base64url");
  const fichier = {
    postes: [
      { id: "b", nom: "B", clePublique: cle, ajouteLe: "2026-10-25T08:00:00.000Z", expireLe: "2026-10-25T20:00:00.000Z" },
      { id: "c", nom: "C", clePublique: cle, ajouteLe: "2026-10-25T08:00:00.000Z", expireLe: null },
    ],
    coupes: ["a"],
  };
  const fusion = fusionnerAccesGestion(base, fichier, Date.parse("2026-10-25T21:00:00.000Z"));
  assert.deepEqual(fusion?.postes.map((p) => p.id), ["c"]);
  assert.equal(fusionnerAccesGestion(base, null, 0), null);
  assert.equal(lireFichierPostesDistance({ postes: [{ id: "x" }], coupes: [] }), null);
  assert.equal(lireFichierPostesDistance({ postes: [], coupes: [1] }), null);
});

test("registre sur disque : écrit en 600, relu, et refusé s'il est lisible par d'autres", () => {
  const dossier = mkdtempSync(join(tmpdir(), "postes-distance-"));
  try {
    const chemin = join(dossier, "gestion-distance.json");
    assert.deepEqual(creerRegistrePostesDistance(chemin).lire(), { postes: [], coupes: [] });
    const ecrit = { postes: [{ id: "d", nom: "D", clePublique: Buffer.alloc(32).toString("base64url"), ajouteLe: "2026-10-25T08:00:00.000Z", expireLe: null }], coupes: [] };
    creerRegistrePostesDistance(chemin).ecrire(ecrit);
    assert.equal(statSync(chemin).mode & 0o777, 0o600);
    assert.deepEqual(creerRegistrePostesDistance(chemin).lire(), ecrit);
    chmodSync(chemin, 0o644);
    assert.equal(creerRegistrePostesDistance(chemin).lire(), null);
    writeFileSync(chemin, "{ pas du json", { mode: 0o600 });
    chmodSync(chemin, 0o600);
    assert.equal(creerRegistrePostesDistance(chemin).lire(), null);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});
