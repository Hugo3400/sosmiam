import assert from "node:assert/strict";
import { test } from "node:test";

import { indexerVignettesLieux } from "~/fonctions/publications/indexer-vignettes-lieux";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";

import { creerHasard } from "../lieux-explorer/donnees.mjs";

function creerPublications(nombre, nombreLieux, graine) {
  const hasard = creerHasard(graine);
  return Array.from({ length: nombre }, (_, i) => {
    const tirage = hasard();
    const media =
      tirage < 0.15 ? undefined : tirage < 0.3 ? { type: "video", video: { uri: `v${i}` }, ...(hasard() < 0.5 ? { affiche: { uri: `a${i}` } } : {}) } : { type: "photos", photos: hasard() < 0.1 ? [] : [{ uri: `p${i}` }, { uri: `q${i}` }] };
    return {
      id: `pub${i}`,
      lieuId: 1 + Math.floor(hasard() * nombreLieux),
      auteur: hasard() < 0.4 ? { type: "lieu" } : { type: "createur", pseudo: `miami${i}` },
      legende: "Miam",
      media,
      jaimes: 0,
      commentaires: 0,
    };
  });
}

test("même vignette que trouverVignetteLieu pour chaque lieu, publications masquées comprises", () => {
  for (const graine of [1, 2, 3, 4, 5]) {
    const nombreLieux = 300;
    const publications = creerPublications(900, nombreLieux, graine);
    const hasard = creerHasard(graine * 31);
    const masquees = new Set(publications.filter(() => hasard() < 0.2).map((p) => p.id));
    const estMasquee = (id) => masquees.has(id);
    const index = indexerVignettesLieux(publications, estMasquee);
    const visibles = publications.filter((p) => !estMasquee(p.id));
    for (let id = 0; id <= nombreLieux + 1; id++) {
      assert.equal(index.get(id) ?? null, trouverVignetteLieu(id, visibles), `lieu ${id}, graine ${graine}`);
    }
  }
});

test("la publication du lieu lui-même passe avant celles des Miamis, même publiée après", () => {
  const publications = [
    { id: "c1", lieuId: 7, auteur: { type: "createur", pseudo: "a" }, legende: "", media: { type: "photos", photos: [{ uri: "createur-1" }] }, jaimes: 0, commentaires: 0 },
    { id: "c2", lieuId: 7, auteur: { type: "createur", pseudo: "b" }, legende: "", media: { type: "photos", photos: [{ uri: "createur-2" }] }, jaimes: 0, commentaires: 0 },
    { id: "l1", lieuId: 7, auteur: { type: "lieu" }, legende: "", media: { type: "photos", photos: [{ uri: "lieu-1" }] }, jaimes: 0, commentaires: 0 },
    { id: "l2", lieuId: 7, auteur: { type: "lieu" }, legende: "", media: { type: "photos", photos: [{ uri: "lieu-2" }] }, jaimes: 0, commentaires: 0 },
  ];
  assert.deepEqual(indexerVignettesLieux(publications, () => false).get(7), { uri: "lieu-1" });
  assert.deepEqual(indexerVignettesLieux(publications, (id) => id === "l1").get(7), { uri: "lieu-2" });
  assert.deepEqual(indexerVignettesLieux(publications, (id) => id.startsWith("l")).get(7), { uri: "createur-1" });
  assert.equal(indexerVignettesLieux(publications, () => true).get(7), undefined);
});

test("un seul passage : chaque publication n'est regardée qu'une fois, quel que soit le nombre de lieux", () => {
  const publications = creerPublications(2_000, 1_600, 9);
  let appels = 0;
  indexerVignettesLieux(publications, () => {
    appels++;
    return false;
  });
  assert.equal(appels, publications.length);
});
