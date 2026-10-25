import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import express from "express";

import { choisirLieuxAccueil, LIEUX_ACCUEIL } from "../src/fonctions/lieux/choisir-lieux-accueil.ts";
import { lireFiltresListeLieux } from "../src/fonctions/lieux/lire-filtres-liste-lieux.ts";
import { creerRoutesLieuxSite } from "../src/routes/lieux-site.ts";
import type { ServicesLieuxSite } from "../src/services/lieux-site.ts";

test("lireFiltresListeLieux : ville et recherche nettoyées, type connu seulement, page bornée", () => {
  assert.deepEqual(lireFiltresListeLieux({}), { ville: null, type: null, recherche: null, page: 1 });
  assert.deepEqual(lireFiltresListeLieux({ ville: "  Montpellier ", type: "resto", q: " moules   frites ", page: "3" }), { ville: "Montpellier", type: "resto", recherche: "moules frites", page: 3 });
  assert.deepEqual(lireFiltresListeLieux({ type: "boite", page: "-2" }), { ville: null, type: null, recherche: null, page: 1 });
  assert.equal(lireFiltresListeLieux({ page: "99999" }).page, 1);
  assert.equal(lireFiltresListeLieux({ page: "9999" }).page, 1000);
  assert.equal(lireFiltresListeLieux({ ville: ["a", "b"] }).ville, null);
  assert.equal(lireFiltresListeLieux({ q: "x".repeat(200) }).recherche?.length, 60);
});

const candidats = [
  ...Array.from({ length: 30 }, (_, i) => ({ id: i + 1, type: "resto", ville: ["Montpellier", "Lyon", "Paris", "Lille", "Marseille"][i % 5] })),
  ...Array.from({ length: 10 }, (_, i) => ({ id: 100 + i, type: "bar", ville: "Montpellier" })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: 200 + i, type: "patisserie", ville: ["Lyon", "Paris"][i % 2] })),
  { id: 300, type: "sortie", ville: "Nantes" },
];

test("choisirLieuxAccueil : 8 lieux, ceux en SOS d'abord, puis restos, pâtisseries, bars et sorties", () => {
  const choisis = choisirLieuxAccueil(candidats, [105], "2026-10-25");
  assert.equal(choisis.length, LIEUX_ACCUEIL);
  assert.equal(choisis[0], 105);
  assert.equal(new Set(choisis).size, LIEUX_ACCUEIL);
  const types = choisis.slice(1).map((id) => candidats.find((c) => c.id === id)?.type);
  assert.deepEqual(types, [...types].sort((a, b) => ["resto", "patisserie", "bar", "sortie"].indexOf(a!) - ["resto", "patisserie", "bar", "sortie"].indexOf(b!)));
  assert.ok(types.filter((t) => t === "resto").length >= 4);
  assert.ok(types.includes("patisserie") && types.includes("sortie"));
  const villes = choisis.flatMap((id) => candidats.filter((c) => c.id === id).map((c) => c.ville));
  assert.ok(new Set(villes).size >= 4);
});

test("choisirLieuxAccueil : le même jour donne le même tirage, un autre jour en donne un autre ; un SOS inconnu est ignoré", () => {
  assert.deepEqual(choisirLieuxAccueil(candidats, [], "2026-10-25"), choisirLieuxAccueil(candidats, [], "2026-10-25"));
  assert.notDeepEqual(choisirLieuxAccueil(candidats, [], "2026-10-25"), choisirLieuxAccueil(candidats, [], "2026-10-26"));
  assert.equal(choisirLieuxAccueil(candidats, [9999], "2026-10-25").includes(9999), false);
  assert.deepEqual(choisirLieuxAccueil([{ id: 1, type: "bar", ville: "Lyon" }], [], "x"), [1]);
  assert.deepEqual(choisirLieuxAccueil([], [], "x"), []);
});

const appels: unknown[] = [];
const services: ServicesLieuxSite = {
  listerPage: async (filtres) => (appels.push(filtres), { lieux: [], total: 0, page: 1, pages: 1 }),
  listerVilles: async () => [{ ville: "Paris", nombre: 3 }],
  listerEpingles: async (filtres) => (appels.push(filtres), [{ id: 1, nom: "A", type: "resto", latitude: 43.6, longitude: 3.8, sos: false }]),
  choisirAccueil: async () => [],
  lireFiche: async (id) => (id === 7 ? ({ id: 7 } as never) : null),
};
const serveur = express().use("/lieux", creerRoutesLieuxSite(services, () => Date.parse("2026-10-25T10:00:00Z"))).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

test("routes du site : filtres lus, réponses en cache public, fiche inconnue en 404", async () => {
  const liste = await fetch(`${adresse}/lieux/liste?ville=Lyon&type=bar&q=tapas&page=2`);
  assert.equal(liste.headers.get("cache-control"), "public, max-age=60");
  assert.deepEqual(await liste.json(), { ok: true, lieux: [], total: 0, page: 1, pages: 1 });
  assert.deepEqual(appels.shift(), { ville: "Lyon", type: "bar", recherche: "tapas", page: 2 });
  const villes = await fetch(`${adresse}/lieux/villes`);
  assert.equal(villes.headers.get("cache-control"), "public, max-age=300");
  assert.deepEqual(await villes.json(), { ok: true, villes: [{ ville: "Paris", nombre: 3 }] });
  assert.equal(((await (await fetch(`${adresse}/lieux/carte?ville=Paris&type=sortie`)).json()) as { epingles: unknown[] }).epingles.length, 1);
  assert.deepEqual(appels.shift(), { ville: "Paris", type: "sortie" });
  assert.equal((await fetch(`${adresse}/lieux/accueil`)).headers.get("cache-control"), "public, max-age=300");
  assert.equal((await fetch(`${adresse}/lieux/site/7`)).status, 200);
  assert.equal((await fetch(`${adresse}/lieux/site/8`)).status, 404);
  assert.equal((await fetch(`${adresse}/lieux/site/abc`)).status, 404);
});
