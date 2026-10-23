import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const racine = pathToFileURL(`${import.meta.dirname}/../src/`).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (specificateur.startsWith("~/")) return suivant(`${racine}${specificateur.slice(2)}.ts`, contexte);
    return suivant(specificateur, contexte);
  },
});

const { estFicheIndexable } = await import("../src/fonctions/lieux/est-fiche-indexable.ts");
const { loader: planDuSite } = await import("../src/routes/ressources/plan-du-site.ts");

const OFFICE = { nom: "l'office de tourisme de Marseille", site: "marseille-tourisme.com", adresse: "https://www.marseille-tourisme.com", licence: null };

test("estFicheIndexable : une fiche non vérifiée au texte repris reste hors de Google, jusqu'à sa vérification", () => {
  assert.equal(estFicheIndexable({ id: 19, estVerifie: false, source: OFFICE }), false);
  assert.equal(estFicheIndexable({ id: 19, estVerifie: true, source: OFFICE }), true);
  assert.equal(estFicheIndexable({ id: 19, estVerifie: false, source: null }), true);
  assert.equal(estFicheIndexable({ id: 19, estVerifie: false }), false);
  assert.equal(estFicheIndexable({ id: 19, estVerifie: true }), true);
  assert.equal(estFicheIndexable({ id: 2810, estVerifie: true, source: null }), false);
});

test("plan du site : seulement les lieux indexables, et aucun lieu tant que l'API ne dit pas lesquels", async () => {
  const fetchAvant = globalThis.fetch;
  let lieux: unknown[] = [];
  globalThis.fetch = (async (adresse: string | URL) => {
    const chemin = new URL(String(adresse)).pathname;
    if (chemin === "/lieux/plan") return Response.json({ ok: true, lieux });
    return Response.json({ ok: true, offres: [] });
  }) as typeof fetch;
  try {
    const lire = async () => (await (await planDuSite({ request: new Request("https://sosmiam.fr/sitemap.xml") } as never)).text()).match(/\/lieux\/\d+/g) ?? [];
    lieux = [
      { id: 19, modifieLe: "2026-10-09T08:00:00.000Z", indexable: false },
      { id: 20, modifieLe: "2026-10-09T08:00:00.000Z", indexable: true },
      { id: 2810, modifieLe: "2026-10-09T08:00:00.000Z", indexable: true },
    ];
    assert.deepEqual(await lire(), ["/lieux/20"]);
    lieux = [{ id: 19, modifieLe: "2026-10-09T08:00:00.000Z" }];
    assert.deepEqual(await lire(), []);
  } finally {
    globalThis.fetch = fetchAvant;
  }
});
