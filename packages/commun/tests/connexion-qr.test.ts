// Connexion par QR code côté client commun : les quatre appels du service du compte, le code lu dans un QR scanné, et les
// textes des erreurs. node --test (npm run commun:tester).
import { test } from "node:test";
import assert from "node:assert/strict";
import { creerClientHttp } from "../src/client-api/client-http.ts";
import { creerCompteApi } from "../src/client-api/api/api-compte.ts";
import { lireCodeConnexionQr } from "../src/fonctions/qr/lire-code-connexion-qr.ts";
import { MESSAGES_SERVICE } from "../src/contenus/messages-services.ts";

type Appel = { url: string; methode: string; entetes: Record<string, string>; corps: unknown };
const CODE = "abcdefghijkmnpqrstuvwxyz23456789";
const json = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json" } });

function creerService(reponses: Response[]) {
  const appels: Appel[] = [];
  const faux = (async (url: string, init: RequestInit) => {
    appels.push({ url, methode: String(init.method), entetes: init.headers as Record<string, string>, corps: init.body ? JSON.parse(String(init.body)) : undefined });
    return reponses.shift() ?? json(500, {});
  }) as unknown as typeof fetch;
  const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: async () => "jeton-1", fetch: faux });
  return { appels, service: creerCompteApi(client) };
}

test("demander et attendre : sans session ; « accepte » rend la session et le compte une fois", async () => {
  const compte = { id: 1, prenom: "Zoé" };
  const { appels, service } = creerService([
    json(201, { ok: true, code: CODE, secret: "s".repeat(43), expireLe: "2026-10-14T10:02:00.000Z" }),
    json(200, { ok: true, etat: "scanne" }),
    json(200, { ok: true, etat: "accepte", session: "jeton-neuf", compte }),
    json(200, { ok: true, etat: "accepte" }),
  ]);
  assert.deepEqual(await service.demanderConnexionQr(), { ok: true, code: CODE, secret: "s".repeat(43), expireLe: "2026-10-14T10:02:00.000Z" });
  assert.deepEqual([appels[0].url, appels[0].corps, appels[0].entetes.Authorization], ["https://api.exemple.fr/comptes/qr", { cible: "app" }, undefined]);
  assert.deepEqual(await service.attendreConnexionQr("s".repeat(43)), { ok: true, etat: "scanne" });
  assert.deepEqual([appels[1].url, appels[1].corps, appels[1].entetes.Authorization], ["https://api.exemple.fr/comptes/qr/attente", { secret: "s".repeat(43) }, undefined]);
  assert.deepEqual(await service.attendreConnexionQr("s".repeat(43)), { ok: true, etat: "accepte", session: "jeton-neuf", compte, nouveau: false });
  // « accepte » sans session : jamais pris pour une connexion
  assert.deepEqual(await service.attendreConnexionQr("s".repeat(43)), { ok: true, etat: "expire" });
});

test("scanner et répondre : avec la session ; erreurs du QR connues de l'app", async () => {
  const demande = { cible: "site", appareil: "Chrome sur Mac", origine: "sosmiam.fr", creeLe: "a", expireLe: "b" };
  const { appels, service } = creerService([
    json(200, { ok: true, demande }),
    json(200, { ok: true }),
    json(410, { ok: false, erreur: "connexion-qr-expiree" }),
    json(409, { ok: false, erreur: "connexion-qr-deja-scannee" }),
    json(409, { ok: false, erreur: "deja-repondu" }),
    json(404, { ok: false, erreur: "connexion-qr-inconnue" }),
    json(403, { ok: false, erreur: "session-app-requise" }),
  ]);
  assert.deepEqual(await service.scannerConnexionQr(CODE), { ok: true, demande });
  assert.deepEqual([appels[0].url, appels[0].corps, appels[0].entetes.Authorization], ["https://api.exemple.fr/app/qr/scanner", { code: CODE }, "Bearer jeton-1"]);
  assert.deepEqual(await service.repondreConnexionQr(CODE, true), { ok: true });
  assert.deepEqual(appels[1].corps, { code: CODE, accepte: true });
  for (const erreur of ["connexion-qr-expiree", "connexion-qr-deja-scannee", "deja-repondu", "connexion-qr-inconnue", "session-app-requise"]) {
    assert.deepEqual(await service.scannerConnexionQr(CODE), { ok: false, erreur });
    assert.ok(MESSAGES_SERVICE[erreur as keyof typeof MESSAGES_SERVICE].texte.length > 20);
  }
});

test("lireCodeConnexionQr : https://sosmiam.fr/q/<code> et sosmiam://q/<code>, rien d'autre", () => {
  assert.equal(lireCodeConnexionQr(`https://sosmiam.fr/q/${CODE}`), CODE);
  assert.equal(lireCodeConnexionQr(` https://www.sosmiam.fr/q/${CODE}/ `), CODE);
  assert.equal(lireCodeConnexionQr(`sosmiam://q/${CODE}`), CODE);
  for (const autre of [`http://sosmiam.fr/q/${CODE}`, `https://sosmiam.fr.pirate.fr/q/${CODE}`, `https://sosmiam.fr/q/${CODE.toUpperCase()}`, `https://sosmiam.fr/l/${CODE}`, `https://sosmiam.fr/q/${CODE}0`, ""]) {
    assert.equal(lireCodeConnexionQr(autre), null, autre);
  }
});
