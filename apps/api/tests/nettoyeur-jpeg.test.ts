import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { retirerMetadonneesJpeg } from "../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { creerNettoyeurJpeg, nettoyerJpeg } from "../src/services/nettoyeur-jpeg.ts";

const lireDonnee = (nom: string) => readFileSync(new URL(`./donnees/${nom}`, import.meta.url));
const PHOTOS = ["photo-exif-position.jpg", "photo-mpf-position.jpg", "photo-progressive.jpg", "photo-intervalles-rst.jpg", "photo-avis-exif-position.jpg"].map(lireDonnee);

const travailleurEssai = (corps: string) =>
  new URL(`data:text/javascript,${encodeURIComponent(`import { parentPort } from "node:worker_threads";\nparentPort.on("message", (o) => { ${corps} });`)}`);
const MUET_SUR_ZERO = travailleurEssai("if (o[0] !== 0) parentPort.postMessage({ propre: o });");
const LENT = travailleurEssai("const fin = Date.now() + 300; while (Date.now() < fin); parentPort.postMessage({ propre: o });");
const statut = (erreur: unknown) => (erreur as { status?: number }).status;

test("hors de la boucle : les mêmes octets que retirerMetadonneesJpeg, null pour un fichier abîmé", async () => {
  for (const photo of PHOTOS) assert.deepEqual(await nettoyerJpeg(photo), retirerMetadonneesJpeg(photo));
  const abimees = PHOTOS.map((photo) => photo.subarray(0, photo.length - 40));
  assert.deepEqual(await Promise.all(abimees.map((photo) => nettoyerJpeg(photo))), abimees.map((photo) => retirerMetadonneesJpeg(photo)));
  assert.equal(await nettoyerJpeg(abimees[0]!), null);
  assert.equal(await nettoyerJpeg(Buffer.from("pas une image")), null);
});

test("un nettoyage long ne gèle pas la boucle d'événements", async () => {
  const nettoyeur = creerNettoyeurJpeg({ travailleurs: 1, script: LENT });
  let tics = 0;
  const minuteur = setInterval(() => (tics += 1), 10);
  try {
    const debut = performance.now();
    assert.deepEqual(await nettoyeur.nettoyer(Buffer.from([1, 2, 3])), Buffer.from([1, 2, 3]));
    const duree = performance.now() - debut;
    assert.ok(duree >= 290, `${duree} ms`);
    assert.ok(tics >= Math.floor(duree / 10) * 0.6, `${tics} tics en ${Math.round(duree)} ms`);
  } finally {
    clearInterval(minuteur);
    await nettoyeur.arreter();
  }
});

test("budget dépassé : null (media-invalide), et un travailleur neuf prend la suite", async () => {
  const nettoyeur = creerNettoyeurJpeg({ travailleurs: 1, budgetMs: 100, script: MUET_SUR_ZERO });
  try {
    const debut = performance.now();
    const [muet, suivant] = await Promise.all([nettoyeur.nettoyer(Buffer.from([0])), nettoyeur.nettoyer(Buffer.from([7, 8]))]);
    assert.equal(muet, null);
    assert.deepEqual(suivant, Buffer.from([7, 8]));
    assert.ok(performance.now() - debut < 2000);
    assert.deepEqual(await nettoyeur.nettoyer(Buffer.from([9])), Buffer.from([9]));
  } finally {
    await nettoyeur.arreter();
  }
});

test("file pleine : 503 tout de suite ; arrêt : ce qui attend et ce qui tourne reçoivent 503, puis plus rien n'entre", async () => {
  const nettoyeur = creerNettoyeurJpeg({ travailleurs: 1, attenteMax: 1, budgetMs: 60_000, script: MUET_SUR_ZERO });
  const premiers = Promise.allSettled([nettoyeur.nettoyer(Buffer.from([0])), nettoyeur.nettoyer(Buffer.from([0]))]);
  await assert.rejects(nettoyeur.nettoyer(Buffer.from([1])), (erreur) => statut(erreur) === 503);
  await nettoyeur.arreter();
  assert.deepEqual((await premiers).map((r) => r.status === "rejected" && statut(r.reason)), [503, 503]);
  await assert.rejects(nettoyeur.nettoyer(Buffer.from([1])), (erreur) => statut(erreur) === 503);
});

test("erreur ou arrêt du travailleur : la demande échoue (500), la suivante repart sur un travailleur neuf", async () => {
  const nettoyeur = creerNettoyeurJpeg({
    travailleurs: 1,
    script: travailleurEssai("if (o[0] === 1) parentPort.postMessage({ erreur: 'boum' }); else if (o[0] === 2) process.exit(3); else parentPort.postMessage({ propre: o });"),
  });
  try {
    await assert.rejects(nettoyeur.nettoyer(Buffer.from([1])), { message: "boum" });
    await assert.rejects(nettoyeur.nettoyer(Buffer.from([2])), (erreur) => statut(erreur) === undefined);
    assert.deepEqual(await nettoyeur.nettoyer(Buffer.from([5])), Buffer.from([5]));
  } finally {
    await nettoyeur.arreter();
  }
});
