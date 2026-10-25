import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import type { ThemeSaisonApi } from "../../../packages/commun/src/types/theme-saison.ts";
import { creerApplication } from "../src/application.ts";

type Reponse = { ok: boolean; jour: string; themes: ThemeSaisonApi[] };

let horloge = Date.parse("2026-10-31T10:00:00Z");
const serveur = creerApplication({ enregistrerInscription: async () => {}, app: { horloge: () => horloge } }).listen(0, "127.0.0.1");
let base = "";

before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  base = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

async function lire(chemin: string, langue?: string) {
  const reponse = await fetch(`${base}${chemin}`, { headers: langue ? { "X-Langue": langue } : {} });
  return { reponse, corps: (await reponse.json()) as Reponse };
}

test("GET /app/themes : les thèmes du jour de Paris, le premier pour la bannière, en français par défaut", async () => {
  horloge = Date.parse("2026-10-31T10:00:00Z");
  const { reponse, corps } = await lire("/app/themes");
  assert.equal(reponse.status, 200);
  assert.equal(corps.jour, "2026-10-31");
  assert.deepEqual(corps.themes.map((t) => t.id), ["halloween", "octobre-rose"]);
  assert.equal(corps.themes[0].textes.nom, "Halloween");
  assert.equal(corps.themes[0].tenue, "halloween");
  assert.deepEqual([corps.themes[1].sobre, corps.themes[1].debut, corps.themes[1].fin], [true, "2026-10-01", "2026-10-31"]);
  assert.equal(reponse.headers.get("cache-control"), "private, max-age=300");
  assert.match(reponse.headers.get("vary") ?? "", /X-Langue/i);
});

test("GET /app/themes : les textes dans la langue de X-Langue", async () => {
  horloge = Date.parse("2026-12-10T10:00:00Z");
  const { corps } = await lire("/app/themes", "en");
  assert.equal(corps.themes[0].id, "noel");
  assert.equal(corps.themes[0].textes.nom, "Christmas");
});

test("GET /app/themes : minuit à Paris compte, pas minuit UTC", async () => {
  horloge = Date.parse("2026-10-31T23:30:00Z");
  const { corps } = await lire("/app/themes");
  assert.equal(corps.jour, "2026-11-01");
  assert.deepEqual(corps.themes.map((t) => t.id), ["movember"]);
});

test("GET /app/themes : un jour sans thème rend une liste vide ; la pasta party seulement avec ?ville=Paris", async () => {
  horloge = Date.parse("2026-09-01T10:00:00Z");
  assert.deepEqual((await lire("/app/themes")).corps.themes, []);
  horloge = Date.parse("2027-04-03T10:00:00Z");
  assert.deepEqual((await lire("/app/themes")).corps.themes, []);
  assert.deepEqual((await lire("/app/themes?ville=Lyon")).corps.themes, []);
  assert.deepEqual((await lire("/app/themes?ville=Paris")).corps.themes.map((t) => t.id), ["pasta-party"]);
  assert.deepEqual((await lire(`/app/themes?ville=${"P".repeat(81)}`)).corps.themes, []);
});
