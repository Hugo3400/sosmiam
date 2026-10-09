// Tests de GET /lieux/plan (fiches publiées pour le plan du site /sitemap.xml), avec un faux service : aucune base.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import type { LieuDuPlan } from "../src/services/lieux-publics.ts";

let lieux: LieuDuPlan[] | "panne" = [];
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  // Les deux routeurs /lieux ensemble : celui de la liste et des fiches ne cache pas /lieux/plan
  listerLieuxPublics: async () => [],
  lireFichePublique: async () => null,
  listerLieuxDuPlan: async () => {
    if (lieux === "panne") throw new Error("base indisponible");
    return lieux;
  },
}).listen(0, "127.0.0.1");
await new Promise<void>((pret) => serveur.once("listening", () => pret()));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

test("GET /lieux/plan : identifiant et date de modification (ISO 8601), rien d'autre, cache public court", async () => {
  lieux = [{ id: 3, modifieLe: new Date("2026-10-08T21:15:00Z") }, { id: 12, modifieLe: new Date("2026-10-09T08:00:00Z") }];
  const reponse = await fetch(`${adresse}/lieux/plan`);
  assert.equal(reponse.status, 200);
  assert.equal(reponse.headers.get("cache-control"), "public, max-age=300");
  assert.deepEqual(await reponse.json(), {
    ok: true, lieux: [{ id: 3, modifieLe: "2026-10-08T21:15:00.000Z" }, { id: 12, modifieLe: "2026-10-09T08:00:00.000Z" }],
  });
  // Les autres adresses /lieux répondent toujours
  assert.deepEqual(await (await fetch(`${adresse}/lieux`)).json(), { ok: true, lieux: [] });
  assert.equal((await fetch(`${adresse}/lieux/publics/3`)).status, 404);
});

test("GET /lieux/plan : aucun lieu publié → liste vide ; base en panne → 500 sobre", async () => {
  lieux = [];
  assert.deepEqual(await (await fetch(`${adresse}/lieux/plan`)).json(), { ok: true, lieux: [] });
  lieux = "panne";
  const panne = await fetch(`${adresse}/lieux/plan`);
  assert.equal(panne.status, 500);
  assert.doesNotMatch(await panne.text(), /base indisponible/);
});

test("sans service fourni, /lieux/plan n'existe pas", async () => {
  const autre = creerApplication({ enregistrerInscription: async () => {}, listerLieuxPublics: async () => [] }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => autre.once("listening", () => pret()));
  try {
    const reponse = await fetch(`http://127.0.0.1:${(autre.address() as AddressInfo).port}/lieux/plan`);
    assert.equal(reponse.status, 404);
  } finally {
    await new Promise<void>((fini) => autre.close(() => fini()));
  }
});
