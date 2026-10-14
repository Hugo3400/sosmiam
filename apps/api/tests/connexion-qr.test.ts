// Tests de la connexion par QR code (comme Discord) : création, attente, scan, acceptation, refus, expiration, 60 s après le
// scan, un autre compte, usage unique (deux attentes en même temps), compte supprimé, limites, journaux propres.
// Tout en mémoire : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { decrireAppareilQr } from "../src/fonctions/comptes/decrire-appareil-qr.ts";
import { creerCodeConnexionQr } from "../src/fonctions/securite/creer-code-connexion-qr.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import { creerConnexionQrEnMemoire } from "../src/services/connexion-qr-en-memoire.ts";

const MOT_DE_PASSE = "mon chat adore les croissants";
const banc = { horloge: Date.parse("2026-10-14T10:00:00Z") };
const memoire = creerComptesEnMemoire(() => banc.horloge);
const qr = creerConnexionQrEnMemoire((id) => memoire.comptes.has(id));
/** Les sessions ouvertes, par compte (chaque ouverture est notée) */
const ouvertes: number[] = [];
const compterSessions = async (compteId: number) => ouvertes.filter((id) => id === compteId).length;

// Les journaux : tout ce qui est écrit pendant les tests, pour vérifier qu'aucun code, secret, jeton ni e-mail n'y passe
const journaux: string[] = [];
const { log, error, warn } = console;
for (const nom of ["log", "error", "warn"] as const) console[nom] = (...morceaux: unknown[]) => void journaux.push(morceaux.map(String).join(" "));

const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: {
    services: memoire.services, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro,
    sessions: { ...memoire.sessions, creer: async (empreinte, session) => (ouvertes.push(session.compteId), memoire.sessions.creer(empreinte, session)) },
    horloge: () => banc.horloge, chiffrement: creerChiffrementDonnees(randomBytes(32)),
  },
  connexionQr: { services: qr.services },
}).listen(0, "127.0.0.1");
await new Promise<void>((pret) => serveur.once("listening", () => pret()));
const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
after(() => {
  Object.assign(console, { log, error, warn });
  serveur.close();
});

let visiteur = 0;
type Options = { jeton?: string; site?: boolean; corps?: unknown; ip?: string; entetes?: Record<string, string> };
async function demander(methode: string, chemin: string, options: Options = {}) {
  const { jeton, site = false } = options;
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: {
      "X-IP-Visiteur": options.ip ?? `visiteur-${++visiteur}`, "Content-Type": "application/json", ...options.entetes,
      ...(jeton ? (site ? { "X-Session-Compte": jeton } : { Authorization: `Bearer ${jeton}` }) : {}),
    },
    body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any>, entetes: reponse.headers };
}

let numero = 0;
/** Un compte de l'app connecté (session « app ») */
async function inscrire() {
  const email = `qr${++numero}@exemple.fr`;
  const corps = { email, motDePasse: MOT_DE_PASSE, prenom: "Zoé", dateNaissance: "2000-01-31", ville: "Nantes", cgu: true, espace: "app" };
  const reponse = await demander("POST", "/comptes", { corps });
  assert.equal(reponse.statut, 201, JSON.stringify(reponse.corps));
  const id = [...memoire.comptes.values()].find((compte) => compte.email === email)!.id;
  return { id, email, jeton: reponse.corps.session as string };
}

const CHROME_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
/** Un QR demandé par le serveur du site (cible « site ») */
async function demanderQrSite(origine = "sosmiam.fr") {
  const reponse = await demander("POST", "/comptes/qr", { corps: { cible: "site", origine }, entetes: { "X-Appareil-Visiteur": CHROME_MAC } });
  assert.equal(reponse.statut, 201, JSON.stringify(reponse.corps));
  return reponse.corps as { code: string; secret: string; expireLe: string };
}
const attendre = (secret: string, ip?: string) => demander("POST", "/comptes/qr/attente", { corps: { secret }, ip });
const scanner = (jeton: string, code: string) => demander("POST", "/app/qr/scanner", { jeton, corps: { code } });
const repondre = (jeton: string, code: string, accepte: boolean) => demander("POST", "/app/qr/repondre", { jeton, corps: { code, accepte } });
/** Avance l'horloge le temps d'un test, puis la remet */
async function plusTard<T>(ms: number, faire: () => Promise<T>): Promise<T> {
  const debut = banc.horloge;
  banc.horloge += ms;
  try {
    return await faire();
  } finally {
    banc.horloge = debut;
  }
}

test("code : 32 caractères [a-z2-9] tirés au sort ; appareil : dit simplement, 60 caractères au plus", () => {
  const codes = new Set(Array.from({ length: 200 }, creerCodeConnexionQr));
  assert.equal(codes.size, 200);
  for (const code of codes) assert.match(code, /^[a-z2-9]{32}$/);
  assert.equal(decrireAppareilQr(CHROME_MAC, "sosmiam.fr"), "Chrome sur Mac");
  assert.equal(decrireAppareilQr("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", "pro.sosmiam.fr"), "Safari sur iPhone");
  assert.equal(decrireAppareilQr("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0", "sosmiam.fr"), "Firefox sur Windows");
  assert.equal(decrireAppareilQr("okhttp/4.12.0", "app"), "l'app SOS Miam sur Android");
  assert.equal(decrireAppareilQr("SOSMiam/1 CFNetwork/1568.100.1 Darwin/24.0.0", "app"), "l'app SOS Miam sur iPhone");
  assert.equal(decrireAppareilQr("", "sosmiam.fr"), "un navigateur");
  assert.ok(decrireAppareilQr("x".repeat(5000), "sosmiam.fr").length <= 60);
});

test("création : 201 { code, secret, expireLe } ; seules les empreintes sont gardées ; champs vérifiés", async () => {
  const { code, secret, expireLe } = await demanderQrSite();
  assert.match(code, /^[a-z2-9]{32}$/);
  assert.match(secret, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(Date.parse(expireLe), banc.horloge + 120_000);
  const gardee = qr.demandes.at(-1)!;
  assert.equal(gardee.codeEmpreinte, calculerEmpreinteJeton(code));
  assert.equal(gardee.secretEmpreinte, calculerEmpreinteJeton(secret));
  assert.ok(!JSON.stringify(qr.demandes).includes(code) && !JSON.stringify(qr.demandes).includes(secret));
  assert.deepEqual([gardee.cible, gardee.origine, gardee.appareil, gardee.statut], ["site", "sosmiam.fr", "Chrome sur Mac", "attente"]);
  const app = await demander("POST", "/comptes/qr", { corps: { cible: "app" }, entetes: { "User-Agent": "okhttp/4.12.0" } });
  assert.equal(app.statut, 201);
  assert.deepEqual([qr.demandes.at(-1)!.origine, qr.demandes.at(-1)!.appareil], ["app", "l'app SOS Miam sur Android"]);
  assert.equal((await demander("POST", "/comptes/qr", { corps: { cible: "montre" } })).corps.champ, "cible");
  assert.equal((await demander("POST", "/comptes/qr", { corps: { cible: "site" } })).corps.champ, "origine");
  assert.equal((await demander("POST", "/comptes/qr", { corps: { cible: "site", origine: "app" } })).corps.champ, "origine");
  assert.equal((await demander("POST", "/comptes/qr", { corps: { cible: "app", origine: "sosmiam.fr" } })).corps.champ, "origine");
  assert.equal(app.entetes.get("cache-control"), "private, no-store");
});

test("attente → scan → acceptation : une session du site, une seule fois", async () => {
  const { id, jeton } = await inscrire();
  const { code, secret } = await demanderQrSite("ambassadeur.sosmiam.fr");
  assert.deepEqual((await attendre(secret)).corps, { ok: true, etat: "attente" });
  const scan = await scanner(jeton, code);
  assert.equal(scan.statut, 200);
  assert.deepEqual(scan.corps.demande, {
    cible: "site", appareil: "Chrome sur Mac", origine: "ambassadeur.sosmiam.fr",
    creeLe: new Date(banc.horloge).toISOString(), expireLe: new Date(banc.horloge + 120_000).toISOString(),
  });
  assert.equal(qr.demandes.at(-1)!.compteId, id);
  assert.deepEqual((await attendre(secret)).corps, { ok: true, etat: "scanne" });
  assert.equal((await scanner(jeton, code)).statut, 200, "le même compte peut rescanner");
  assert.deepEqual((await repondre(jeton, code, true)).corps, { ok: true });
  const fin = await attendre(secret);
  assert.equal(fin.corps.etat, "accepte");
  assert.equal(fin.corps.compte.prenom, "Zoé");
  const session = await demander("GET", "/comptes/session", { jeton: fin.corps.session, site: true });
  assert.equal(session.statut, 200);
  // Session du site : fermée après 30 jours sans visite
  await plusTard(31 * 86_400_000, async () => assert.equal((await demander("GET", "/comptes/session", { jeton: fin.corps.session, site: true })).statut, 401));
  assert.deepEqual((await attendre(secret)).corps, { ok: true, etat: "expire" }, "usage unique");
  assert.equal((await repondre(jeton, code, true)).statut, 410);
  assert.equal((await scanner(jeton, code)).statut, 410);
});

test("cible « app » : une session de l'app (1 an)", async () => {
  const { jeton } = await inscrire();
  const { code, secret } = (await demander("POST", "/comptes/qr", { corps: { cible: "app" } })).corps;
  assert.equal((await scanner(jeton, code)).corps.demande.origine, "app");
  await repondre(jeton, code, true);
  const { session } = (await attendre(secret)).corps;
  await plusTard(200 * 86_400_000, async () => assert.equal((await demander("GET", "/comptes/session", { jeton: session })).statut, 200));
});

test("refus : « refuse » pour l'appareil, aucune session ; plus de réponse possible", async () => {
  const { jeton } = await inscrire();
  const { code, secret } = await demanderQrSite();
  await scanner(jeton, code);
  assert.deepEqual((await repondre(jeton, code, false)).corps, { ok: true });
  assert.deepEqual((await attendre(secret)).corps, { ok: true, etat: "refuse" });
  assert.equal((await repondre(jeton, code, true)).corps.erreur, "deja-repondu");
  assert.equal((await scanner(jeton, code)).corps.erreur, "deja-repondu");
});

test("expiration : après 2 minutes, plus de scan ni d'acceptation ; l'appareil voit « expire »", async () => {
  const { jeton } = await inscrire();
  const { code, secret } = await demanderQrSite();
  await plusTard(120_000, async () => {
    assert.deepEqual((await attendre(secret)).corps, { ok: true, etat: "expire" });
    assert.deepEqual([(await scanner(jeton, code)).statut, (await scanner(jeton, code)).corps.erreur], [410, "connexion-qr-expiree"]);
  });
  const autre = await demanderQrSite();
  await scanner(jeton, autre.code);
  await plusTard(120_000, async () => assert.equal((await repondre(jeton, autre.code, true)).corps.erreur, "connexion-qr-expiree"));
  // Inconnu, ou mal formé
  assert.deepEqual([(await scanner(jeton, creerCodeConnexionQr())).statut, (await scanner(jeton, creerCodeConnexionQr())).corps.erreur], [404, "connexion-qr-inconnue"]);
  assert.equal((await scanner(jeton, "PAS-UN-CODE")).corps.champ, "code");
  assert.equal((await attendre("court")).corps.champ, "secret");
  assert.deepEqual((await attendre("a".repeat(43))).corps, { ok: true, etat: "expire" });
});

test("60 s après le scan : accepter est refusé (410), l'appareil voit « expire »", async () => {
  const { jeton } = await inscrire();
  const { code, secret } = await demanderQrSite();
  await scanner(jeton, code);
  await plusTard(60_001, async () => {
    assert.equal((await repondre(jeton, code, true)).statut, 410);
    assert.deepEqual((await attendre(secret)).corps, { ok: true, etat: "expire" });
    assert.equal((await scanner(jeton, code)).statut, 410);
  });
  await plusTard(59_000, async () => assert.equal((await repondre(jeton, code, true)).statut, 200));
});

test("un autre compte : ne peut ni rescanner (409) ni répondre (404) ; une session du site ne valide pas (403)", async () => {
  const zoe = await inscrire();
  const intrus = await inscrire();
  const { code, secret } = await demanderQrSite();
  await scanner(zoe.jeton, code);
  const rescan = await scanner(intrus.jeton, code);
  assert.deepEqual([rescan.statut, rescan.corps.erreur], [409, "connexion-qr-deja-scannee"]);
  const reponse = await repondre(intrus.jeton, code, true);
  assert.deepEqual([reponse.statut, reponse.corps.erreur], [404, "connexion-qr-inconnue"]);
  assert.deepEqual((await attendre(secret)).corps, { ok: true, etat: "scanne" });
  // Une session du site (support « site ») ne scanne pas
  const site = await demander("POST", "/comptes/session", { corps: { email: intrus.email, motDePasse: MOT_DE_PASSE } });
  const autre = await demanderQrSite();
  assert.deepEqual([(await scanner(site.corps.session, autre.code)).statut, (await scanner(site.corps.session, autre.code)).corps.erreur], [403, "session-app-requise"]);
  assert.equal((await demander("POST", "/app/qr/scanner", { corps: { code } })).statut, 401);
  assert.equal((await repondre(zoe.jeton, code, "oui" as never)).corps.champ, "accepte");
});

test("usage unique : deux attentes en même temps → une seule session", async () => {
  const { id, jeton } = await inscrire();
  const { code, secret } = await demanderQrSite();
  await scanner(jeton, code);
  await repondre(jeton, code, true);
  const avant = await compterSessions(id);
  const reponses = await Promise.all(Array.from({ length: 6 }, () => attendre(secret)));
  const acceptees = reponses.filter((r) => r.corps.etat === "accepte");
  assert.equal(acceptees.length, 1);
  assert.equal(reponses.filter((r) => r.corps.etat === "expire").length, 5);
  assert.equal(await compterSessions(id), avant + 1);
});

test("compte supprimé avant l'attente : pas de session, « expire »", async () => {
  const { id, jeton } = await inscrire();
  const { code, secret } = await demanderQrSite();
  await scanner(jeton, code);
  await repondre(jeton, code, true);
  const effacement = await demander("DELETE", "/comptes/moi", { jeton, corps: { motDePasse: MOT_DE_PASSE } });
  assert.equal(effacement.statut, 200);
  assert.equal(memoire.comptes.has(id), false);
  assert.deepEqual((await attendre(secret)).corps, { ok: true, etat: "expire" });
});

test("ménage : les demandes expirées depuis plus d'un jour partent", () => {
  const avant = qr.demandes.length;
  assert.ok(avant > 0);
  assert.equal(qr.effacerExpirees(banc.horloge - 86_400_000), 0);
  assert.equal(qr.effacerExpirees(banc.horloge + 86_400_000 * 400), avant);
});

test("limites : 20 QR par visiteur en 10 minutes, 120 attentes par minute, 30 scans par compte", async () => {
  for (let i = 0; i < 20; i++) assert.equal((await demander("POST", "/comptes/qr", { corps: { cible: "app" }, ip: "10.0.0.1" })).statut, 201);
  const trop = await demander("POST", "/comptes/qr", { corps: { cible: "app" }, ip: "10.0.0.1" });
  assert.deepEqual([trop.statut, trop.corps.erreur], [429, "trop-de-demandes"]);
  assert.ok(Number(trop.entetes.get("retry-after")) > 0);
  const { secret } = await demanderQrSite();
  for (let i = 0; i < 120; i++) assert.equal((await attendre(secret, "10.0.0.2")).statut, 200);
  assert.equal((await attendre(secret, "10.0.0.2")).statut, 429);
  const { jeton } = await inscrire();
  for (let i = 0; i < 30; i++) await scanner(jeton, creerCodeConnexionQr());
  assert.equal((await scanner(jeton, creerCodeConnexionQr())).statut, 429);
});

test("journaux propres : ni code, ni secret, ni jeton, ni e-mail", async () => {
  const { email, jeton } = await inscrire();
  const { code, secret } = await demanderQrSite();
  await scanner(jeton, code);
  await repondre(jeton, code, true);
  const { session } = (await attendre(secret)).corps;
  // Une panne des données ne fait pas fuiter le code non plus
  const lire = qr.services.lireParCode;
  qr.services.lireParCode = async () => {
    throw new Error("base en panne");
  };
  try {
    assert.equal((await scanner(jeton, creerCodeConnexionQr())).statut, 500);
  } finally {
    qr.services.lireParCode = lire;
  }
  const tout = journaux.join("\n");
  for (const secretALire of [code, secret, jeton, session, email]) assert.ok(!tout.includes(secretALire));
});
