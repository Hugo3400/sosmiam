// Tests de GET /lieux/plan (fiches publiées pour le plan du site /sitemap.xml), avec un faux service : aucune base.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

import express from "express";

import { creerApplication } from "../src/application.ts";
import { DUREE_CACHE_PLAN_LIEUX } from "../src/controleurs/lieux-publics.ts";
import { creerRoutePlanLieux, LIMITE_PLAN_LIEUX } from "../src/routes/lieux-publics.ts";
import type { LieuDuPlan } from "../src/services/lieux-publics.ts";

const serveurs: { close: (fini: () => void) => unknown }[] = [];
after(() => Promise.all(serveurs.map((serveur) => new Promise<void>((fini) => serveur.close(() => fini())))));

async function ecouter(application: express.Express): Promise<string> {
  const serveur = application.listen(0, "127.0.0.1");
  serveurs.push(serveur);
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  return `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
}

function lancerApplication(lister: () => Promise<LieuDuPlan[]>) {
  return ecouter(creerApplication({
    enregistrerInscription: async () => {},
    listerLieuxPublics: async () => [],
    lireFichePublique: async () => null,
    listerLieuxDuPlan: lister,
  }));
}

test("GET /lieux/plan : identifiant, date de modification (ISO 8601) et indexable, rien d'autre, cache public court", async () => {
  const adresse = await lancerApplication(async () => [{ id: 3, modifieLe: new Date("2026-10-08T21:15:00Z"), indexable: true }, { id: 12, modifieLe: new Date("2026-10-09T08:00:00Z"), indexable: false }]);
  const reponse = await fetch(`${adresse}/lieux/plan`);
  assert.equal(reponse.status, 200);
  assert.equal(reponse.headers.get("cache-control"), "public, max-age=300");
  assert.match(reponse.headers.get("content-type") ?? "", /^application\/json/);
  assert.deepEqual(await reponse.json(), {
    ok: true, lieux: [{ id: 3, modifieLe: "2026-10-08T21:15:00.000Z", indexable: true }, { id: 12, modifieLe: "2026-10-09T08:00:00.000Z", indexable: false }],
  });
  assert.deepEqual(await (await fetch(`${adresse}/lieux`)).json(), { ok: true, lieux: [] });
  assert.equal((await fetch(`${adresse}/lieux/publics/3`)).status, 404);
});

test("GET /lieux/plan : aucun lieu publié → liste vide ; base en panne → 500 sobre, jamais gardée en cache", async () => {
  let lieux: LieuDuPlan[] | "panne" = "panne";
  const adresse = await lancerApplication(async () => {
    if (lieux === "panne") throw new Error("base indisponible");
    return lieux;
  });
  const journal = console.error;
  console.error = () => {};
  try {
    const panne = await fetch(`${adresse}/lieux/plan`);
    assert.equal(panne.status, 500);
    assert.doesNotMatch(await panne.text(), /base indisponible/);
  } finally {
    console.error = journal;
  }
  lieux = [];
  assert.deepEqual(await (await fetch(`${adresse}/lieux/plan`)).json(), { ok: true, lieux: [] });
});

test("GET /lieux/plan : une seule lecture de la base par minute, partagée par les demandes simultanées", async () => {
  const horloge = { maintenant: 0 };
  let lectures = 0;
  let lieux: LieuDuPlan[] = [{ id: 1, modifieLe: new Date("2026-10-09T08:00:00Z"), indexable: true }];
  const application = express();
  application.use("/lieux", creerRoutePlanLieux(async () => {
    lectures += 1;
    await new Promise((fini) => setTimeout(fini, 20));
    return lieux;
  }, { horloge: () => horloge.maintenant }));
  const adresse = await ecouter(application);
  const lire = async () => ((await (await fetch(`${adresse}/lieux/plan`)).json()) as { lieux: { id: number }[] }).lieux.map(({ id }) => id);
  assert.deepEqual(await Promise.all([lire(), lire(), lire()]), [[1], [1], [1]]);
  assert.equal(lectures, 1);
  lieux = [{ id: 1, modifieLe: new Date("2026-10-09T08:00:00Z"), indexable: true }, { id: 2, modifieLe: new Date("2026-10-09T09:00:00Z"), indexable: true }];
  horloge.maintenant = DUREE_CACHE_PLAN_LIEUX - 1;
  assert.deepEqual(await lire(), [1]);
  assert.equal(lectures, 1);
  horloge.maintenant = DUREE_CACHE_PLAN_LIEUX;
  assert.deepEqual(await lire(), [1, 2]);
  assert.equal(lectures, 2);
});

test(`GET /lieux/plan : ${LIMITE_PLAN_LIEUX.maximum} demandes en 10 minutes par visiteur transmis, jamais de limite pour le site (sans X-IP-Visiteur)`, async () => {
  const adresse = await lancerApplication(async () => []);
  const demander = (ip?: string) => fetch(`${adresse}/lieux/plan`, { headers: ip ? { "X-IP-Visiteur": ip } : {} });
  for (let i = 0; i < LIMITE_PLAN_LIEUX.maximum; i++) assert.equal((await demander("203.0.113.40")).status, 200, `demande ${i + 1}`);
  const trop = await demander("203.0.113.40");
  assert.deepEqual([trop.status, await trop.json()], [429, { ok: false, erreur: "trop-de-demandes" }]);
  assert.ok(Number(trop.headers.get("retry-after")) > 0);
  assert.equal((await demander("2001:db8:4000::1")).status, 200);
  for (let i = 0; i < LIMITE_PLAN_LIEUX.maximum + 5; i++) assert.equal((await demander()).status, 200, `demande du site ${i + 1}`);
});

test("sans service fourni, /lieux/plan n'existe pas", async () => {
  const adresse = await ecouter(creerApplication({ enregistrerInscription: async () => {}, listerLieuxPublics: async () => [] }));
  assert.equal((await fetch(`${adresse}/lieux/plan`)).status, 404);
});
