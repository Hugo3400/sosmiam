import assert from "node:assert/strict";
import { test } from "node:test";

import { POIDS_MAX_PHOTO_ENVOYEE } from "@sos-miam/commun/regles/photos";
import { QUALITES_PHOTO, reduireJusquAuPoids } from "~/fonctions/photos/reduire-jusqu-au-poids";

const MO = 1024 * 1024;

function encodeurFictif(poidsDe) {
  const essais = [];
  const encoder = async (qualite, echelle) => {
    essais.push([qualite, echelle]);
    return { uri: `fichier-${essais.length}.jpg`, largeur: Math.round(2048 * echelle), hauteur: Math.round(1536 * echelle), poids: poidsDe(qualite, echelle) };
  };
  return { encoder, essais };
}

test("la règle commune : 1 Mo au plus pour une photo envoyée", () => {
  assert.equal(POIDS_MAX_PHOTO_ENVOYEE, MO);
});

test("une photo déjà légère part au premier essai, à la meilleure qualité, sans rien effacer", async () => {
  const oublies = [];
  const { encoder, essais } = encodeurFictif(() => 300 * 1024);
  const photo = await reduireJusquAuPoids(encoder, MO, [1, 0.75, 0.5], (uri) => oublies.push(uri));
  assert.deepEqual(essais, [[QUALITES_PHOTO[0], 1]]);
  assert.deepEqual([photo.uri, photo.largeur], ["fichier-1.jpg", 2048]);
  assert.deepEqual(oublies, []);
});

test("une photo lourde baisse de qualité jusqu'à passer sous 1 Mo, et les essais ratés sont effacés", async () => {
  const oublies = [];
  const { encoder, essais } = encodeurFictif((qualite) => (qualite > 0.7 ? 1.4 * MO : 0.8 * MO));
  const photo = await reduireJusquAuPoids(encoder, MO, [1, 0.75, 0.5], (uri) => oublies.push(uri));
  assert.deepEqual(essais.map(([q]) => q), [0.85, 0.75, 0.65]);
  assert.equal(photo.uri, "fichier-3.jpg");
  assert.ok(photo.poids <= MO);
  assert.deepEqual(oublies, ["fichier-1.jpg", "fichier-2.jpg"]);
});

test("si la qualité ne suffit pas, la photo rapetisse ; exactement 1 Mo passe", async () => {
  const { encoder, essais } = encodeurFictif((_q, echelle) => (echelle === 1 ? 3 * MO : MO));
  const photo = await reduireJusquAuPoids(encoder, MO, [1, 0.75, 0.5], () => {});
  assert.equal(essais.length, QUALITES_PHOTO.length + 1);
  assert.deepEqual(essais.at(-1), [QUALITES_PHOTO[0], 0.75]);
  assert.deepEqual([photo.largeur, photo.poids], [1536, MO]);
});

test("une photo de profil ne change jamais de taille : seule la qualité baisse", async () => {
  const { encoder, essais } = encodeurFictif(() => 2 * MO);
  await assert.rejects(reduireJusquAuPoids(encoder, MO, [1], () => {}), /photo-trop-lourde/);
  assert.ok(essais.every(([, echelle]) => echelle === 1));
  assert.equal(essais.length, QUALITES_PHOTO.length);
});

test("un poids illisible compte comme trop lourd, jamais comme léger", async () => {
  const { encoder } = encodeurFictif((_q, echelle) => (echelle === 1 ? Number.POSITIVE_INFINITY : 200 * 1024));
  const photo = await reduireJusquAuPoids(encoder, MO, [1, 0.5], () => {});
  assert.equal(photo.largeur, 1024);
});
