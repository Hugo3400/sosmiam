import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import { comparerVersionsApp } from "../src/fonctions/texte/comparer-versions-app.ts";
import { creerVersionsAppGestion } from "../src/services/gestion/versions-app-gestion.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

test("comparer des versions a.b.c : chiffre par chiffre, pas comme du texte", () => {
  assert.equal(comparerVersionsApp("1.10.0", "1.9.9"), 1);
  assert.equal(comparerVersionsApp("1.0.0", "1.0.0"), 0);
  assert.equal(comparerVersionsApp("0.9.12", "1.0.0"), -1);
});

test("le fichier des versions s'écrit d'un bloc et se relit tout de suite", async () => {
  const dossier = mkdtempSync(join(tmpdir(), "versions-app-"));
  try {
    const fichier = join(dossier, "versions-app.json");
    const parDefaut = { minimale: { ios: "0.0.0", android: "0.0.0" }, derniere: { ios: "0.0.0", android: "0.0.0" } };
    const v = creerVersionsAppGestion(fichier, parDefaut);
    assert.deepEqual(await v.lireVersionsApp(), { ...parDefaut, fichier: false });
    const nouvelles = { minimale: { ios: "1.0.0", android: "1.0.0" }, derniere: { ios: "1.1.0", android: "1.0.2" } };
    await v.ecrireVersionsApp(nouvelles);
    assert.deepEqual(await v.lireVersionsApp(), { ...nouvelles, fichier: true });
    assert.deepEqual(readdirSync(dossier), ["versions-app.json"]);
    assert.equal(JSON.parse(readFileSync(fichier, "utf8")).derniere.ios, "1.1.0");
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

const ecrits: unknown[] = [];
const journal: string[] = [];
const actuelles = { minimale: { ios: "1.0.0", android: "1.0.0" }, derniere: { ios: "1.0.0", android: "1.0.0" }, fichier: false };
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  lireVersionsAppGestion: async () => actuelles,
  ecrireVersionsAppGestion: async (versions: unknown) => void ecrits.push(versions),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("route : forme a.b.c exigée, minimale jamais au-dessus de la dernière, changement noté au journal", async () => {
  const ok = { minimale: { ios: "1.0.0", android: "1.0.0" }, derniere: { ios: "1.2.0", android: "1.1.0" } };
  const forme = await banc.demander("PUT", "/versions-app", { session, corps: { ...ok, derniere: { ios: "1.2", android: "1.1.0" } } });
  assert.deepEqual([forme.status, (await forme.json()).champ], [400, "derniere.ios"]);
  const haute = await banc.demander("PUT", "/versions-app", { session, corps: { ...ok, minimale: { ios: "1.0.0", android: "1.10.0" } } });
  assert.deepEqual([haute.status, (await haute.json()).erreur], [400, "minimale-trop-haute"]);
  assert.equal(ecrits.length, 0);
  assert.equal((await banc.demander("PUT", "/versions-app", { session, corps: ok })).status, 200);
  assert.deepEqual(ecrits, [ok]);
  assert.equal(journal.at(-1), "Versions de l'app changées · ios : minimale 1.0.0 → 1.0.0, dernière 1.0.0 → 1.2.0 ; android : minimale 1.0.0 → 1.0.0, dernière 1.0.0 → 1.1.0");
  assert.equal((await banc.demander("GET", "/versions-app", { session })).status, 200);
});
