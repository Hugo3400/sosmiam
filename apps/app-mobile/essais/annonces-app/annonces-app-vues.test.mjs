import assert from "node:assert/strict";
import { test } from "node:test";

import { lireAnnoncesAppVues, noterAnnonceAppVue } from "~/stockage/annonces-app-vues";

const CLE = "sosmiam.annonces-app-deja-vues";
const ANCIENNE_CLE = "sosmiam.annonces-app-vues";
const magasin = () => (globalThis.__magasin ??= new Map());

test("valeur gardée illisible : la lecture échoue (rien ne s'affiche) au lieu de repartir de zéro et de remontrer les vues", async () => {
  magasin().set(CLE, "[5,");
  await assert.rejects(lireAnnoncesAppVues());
  await assert.rejects(noterAnnonceAppVue(6));
  assert.equal(magasin().get(CLE), "[5,");
});

test("valeur gardée qui n'est pas une liste : la lecture échoue aussi", async () => {
  magasin().set(CLE, JSON.stringify({ vues: [5] }));
  await assert.rejects(lireAnnoncesAppVues());
});

test("liste gardée : seuls les identifiants entiers restent ; l'ancienne clé (vues de la démo d'avant, id 2) est ignorée", async () => {
  magasin().set(ANCIENNE_CLE, "[2]");
  magasin().set(CLE, JSON.stringify([1, "2", 3.5, null, 4, -2]));
  assert.deepEqual(await lireAnnoncesAppVues(), [1, 4, -2]);
});

test("une vue notée reste sur le téléphone, sous la nouvelle clé seulement", async () => {
  await noterAnnonceAppVue(7);
  assert.deepEqual(JSON.parse(magasin().get(CLE)), [1, 4, -2, 7]);
  assert.equal(magasin().get(ANCIENNE_CLE), "[2]");
});

test("au plus 200 identifiants gardés, les plus récents", async () => {
  for (let id = 100; id < 400; id += 1) await noterAnnonceAppVue(id);
  const gardees = JSON.parse(magasin().get(CLE));
  assert.equal(gardees.length, 200);
  assert.equal(gardees[0], 200);
  assert.equal(gardees.at(-1), 399);
});
