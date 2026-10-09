// Tests du plan du site (/sitemap.xml) : le XML (fonctions/seo/construire-plan-du-site.ts) et la lecture des fiches
// publiées à l'API (listerLieuxDuPlan, GET /lieux/plan), avec une fausse API locale : node --test tests/*.test.ts.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { construirePlanDuSite } from "../src/fonctions/seo/construire-plan-du-site.ts";

/** Ce que répond la fausse API à GET /lieux/plan : un statut et un corps, ou « muette » (elle ne répond jamais) */
let prevue: { statut: number; corps: unknown } | "muette" = { statut: 200, corps: { ok: true, lieux: [] } };
const serveur = createServer((requete, reponse) => {
  if (requete.url !== "/lieux/plan") return void reponse.writeHead(404).end();
  if (prevue === "muette") return;
  reponse.writeHead(prevue.statut, { "Content-Type": "application/json" }).end(JSON.stringify(prevue.corps));
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => {
  serveur.closeAllConnections();
  serveur.close();
});
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
// @ts-ignore : idem
const { listerLieuxDuPlan } = await import("../src/services/lieux.server.ts");

test("construirePlanDuSite : une <url> par adresse, <lastmod> seulement si la date se lit, caractères échappés", () => {
  const xml = construirePlanDuSite([
    { adresse: "https://sosmiam.fr/" },
    { adresse: "https://sosmiam.fr/lieux/12", modifieLe: "2026-10-09T08:15:30.123Z" },
    { adresse: "https://sosmiam.fr/lieux/13", modifieLe: "pas une date" },
    { adresse: "https://sosmiam.fr/?a=1&b=2" },
  ]);
  assert.equal(xml, [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <url><loc>https://sosmiam.fr/</loc></url>",
    "  <url><loc>https://sosmiam.fr/lieux/12</loc><lastmod>2026-10-09T08:15:30Z</lastmod></url>",
    "  <url><loc>https://sosmiam.fr/lieux/13</loc></url>",
    "  <url><loc>https://sosmiam.fr/?a=1&amp;b=2</loc></url>",
    "</urlset>",
    "",
  ].join("\n"));
});

test("listerLieuxDuPlan : les fiches publiées de l'API, sans les lignes de forme inattendue", async () => {
  prevue = { statut: 200, corps: { ok: true, lieux: [
    { id: 3, modifieLe: "2026-10-08T21:15:00.000Z" }, { id: 12, modifieLe: "2026-10-09T08:00:00.000Z" },
    { id: -1, modifieLe: "2026-10-09T08:00:00.000Z" }, { id: "4", modifieLe: "2026-10-09T08:00:00.000Z" }, { id: 5, modifieLe: "hier" }, null,
  ] } };
  assert.deepEqual(await listerLieuxDuPlan(), [{ id: 3, modifieLe: "2026-10-08T21:15:00.000Z" }, { id: 12, modifieLe: "2026-10-09T08:00:00.000Z" }]);
});

test("listerLieuxDuPlan : API en panne, corps inattendu ou API muette (2 s) → null, sans lever d'erreur", async () => {
  prevue = { statut: 500, corps: { ok: false, erreur: "erreur-serveur" } };
  assert.equal(await listerLieuxDuPlan(), null);
  prevue = { statut: 200, corps: { ok: true } };
  assert.equal(await listerLieuxDuPlan(), null);
  prevue = "muette";
  const debut = Date.now();
  assert.equal(await listerLieuxDuPlan(), null);
  assert.ok(Date.now() - debut < 3500, "le plan n'attend pas plus de 2 s");
});
