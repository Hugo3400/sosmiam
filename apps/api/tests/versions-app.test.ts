import assert from "node:assert/strict";
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { creerVersionsApp } from "../src/services/versions-app.ts";

const dossier = mkdtempSync(join(tmpdir(), "versions-app-"));
after(() => rmSync(dossier, { recursive: true, force: true }));
const PAR_DEFAUT = { minimale: { ios: "1.0.0", android: "0.0.0" }, derniere: { ios: "0.0.0", android: "0.0.0" } };

test("sans fichier : les versions par défaut (variables d'environnement)", () => {
  const versions = creerVersionsApp(join(dossier, "absent.json"), PAR_DEFAUT);
  assert.deepEqual([versions.minimale(), versions.derniere()], [PAR_DEFAUT.minimale, PAR_DEFAUT.derniere]);
});

test("le fichier passe avant les variables, champ par champ ; une valeur mal écrite garde celle par défaut", () => {
  const fichier = join(dossier, "versions.json");
  writeFileSync(fichier, JSON.stringify({ minimale: { ios: "1.1.0", android: "v2" }, derniere: { ios: "1.3.0" } }));
  const versions = creerVersionsApp(fichier, PAR_DEFAUT);
  assert.deepEqual(versions.minimale(), { ios: "1.1.0", android: "0.0.0" });
  assert.deepEqual(versions.derniere(), { ios: "1.3.0", android: "0.0.0" });
});

test("le logiciel change le fichier : relu sans redémarrer ; illisible ou effacé : retour aux valeurs par défaut", () => {
  const fichier = join(dossier, "change.json");
  writeFileSync(fichier, JSON.stringify({ derniere: { ios: "1.2.0", android: "1.2.0" } }));
  const versions = creerVersionsApp(fichier, PAR_DEFAUT);
  assert.equal(versions.derniere().ios, "1.2.0");
  writeFileSync(fichier, JSON.stringify({ derniere: { ios: "1.5.0", android: "1.2.0" } }));
  utimesSync(fichier, new Date(), new Date(Date.now() + 5000));
  assert.equal(versions.derniere().ios, "1.5.0");
  writeFileSync(fichier, "{ pas du json");
  utimesSync(fichier, new Date(), new Date(Date.now() + 10_000));
  assert.deepEqual(versions.derniere(), PAR_DEFAUT.derniere);
  rmSync(fichier);
  assert.deepEqual(versions.minimale(), PAR_DEFAUT.minimale);
});
