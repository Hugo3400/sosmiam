// Tests du QR de vitrine d'un lieu (https://sosmiam.fr/l/<code>) : forme du code, lecture du lieu à l'API (GET
// /app/lieux/code/:code, simulée par une fausse API locale) et partage des hôtes. node --test tests/*.test.ts.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { estCodeVitrine } from "../src/fonctions/lieux/est-code-vitrine.ts";
// @ts-ignore : idem
import { choisirRedirectionHote } from "../src/fonctions/hotes/choisir-redirection-hote.ts";

/** Lieux de démo de la fausse API : code → id (seulement les lieux publiés, comme l'API) */
const PUBLIES: Record<string, number> = { abcd2345: 42 };
let panne = false;
const ipsRecues: (string | undefined)[] = [];
const serveur = createServer((requete, reponse) => {
  ipsRecues.push(requete.headers["x-ip-visiteur"] as string | undefined);
  const code = /^\/app\/lieux\/code\/([^/?]+)$/.exec(requete.url ?? "")?.[1] ?? "";
  if (panne) return void reponse.writeHead(500, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: false, erreur: "erreur-serveur" }));
  const lieuId = PUBLIES[code];
  if (lieuId === undefined) return void reponse.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: false, erreur: "lieu-inconnu" }));
  reponse.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true, lieuId }));
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => serveur.close());
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
// @ts-ignore : idem
const { trouverLieuParCode } = await import("../src/services/lieux.server.ts");

test("estCodeVitrine : 8 caractères a-z et 2-9, minuscules seulement", () => {
  for (const code of ["abcd2345", "zzzzzzzz", "a2b3c4d5"]) assert.equal(estCodeVitrine(code), true, code);
  for (const code of ["ABCD2345", "abcd234", "abcd23456", "abcd2341", "abcd2340", "abcd-234", "", undefined, "abcd234%"]) {
    assert.equal(estCodeVitrine(code), false, String(code));
  }
});

test("trouverLieuParCode : lieu publié → son id ; code inconnu (ou lieu non publié) → lieu-inconnu ; panne → indisponible", async () => {
  assert.deepEqual(await trouverLieuParCode("abcd2345", "203.0.113.7"), { ok: true, lieuId: 42 });
  assert.equal(ipsRecues.at(-1), "203.0.113.7", "la limite de l'API reste par visiteur");
  assert.deepEqual(await trouverLieuParCode("zzzz9999", null), { ok: false, erreur: "lieu-inconnu" });
  panne = true;
  assert.deepEqual(await trouverLieuParCode("abcd2345", null), { ok: false, erreur: "indisponible" });
  panne = false;
});

test("partage des hôtes : /l/<code> est servi sur sosmiam.fr, et renvoyé vers sosmiam.fr depuis les deux espaces", () => {
  assert.equal(choisirRedirectionHote("sosmiam.fr", "/l/abcd2345"), null);
  assert.equal(choisirRedirectionHote("sosmiam.fr", "/l/abcd2345.data"), null);
  assert.deepEqual(choisirRedirectionHote("pro.sosmiam.fr", "/l/abcd2345"), { adresse: "https://sosmiam.fr/l/abcd2345", statut: 301 });
  assert.deepEqual(choisirRedirectionHote("ambassadeur.sosmiam.fr", "/l/abcd2345?utm_source=vitrine"), {
    adresse: "https://sosmiam.fr/l/abcd2345?utm_source=vitrine", statut: 301,
  });
});
