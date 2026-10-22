import assert from "node:assert/strict";
import { test } from "node:test";

import { NOUVEAUTES_VERSIONS } from "~/contenus/nouveautes-versions";
import { choisirNouveautesAMontrer } from "~/fonctions/nouveautes/choisir-nouveautes-a-montrer";
import { comparerVersions } from "~/fonctions/version/comparer-versions";
import { lirePartiesVersion } from "~/fonctions/version/lire-parties-version";

const VERSIONS = [
  { version: "1.0.2", libelle: "1.0.2", date: null, titre: "Deux", points: [{ emoji: "💬", titre: "a", detail: "b" }] },
  { version: "1.0.1", libelle: "1.0.1", date: null, titre: "Un", points: [{ emoji: "🌙", titre: "c", detail: "d" }] },
];

const choisir = (installee, vue, inscrit = true) => choisirNouveautesAMontrer({ installee, vue, inscrit, versions: VERSIONS });

test("mise à jour vers une version qui a ses nouveautés : on les montre", () => {
  assert.equal(choisir("1.0.2", "1.0.1").aMontrer?.version, "1.0.2");
  assert.equal(choisir("1.0.2", "1.0.1").aNoterSansMontrer, null);
});

test("même version déjà vue, ou version plus ancienne : rien", () => {
  assert.deepEqual(choisir("1.0.2", "1.0.2"), { aMontrer: null, aNoterSansMontrer: null });
  assert.deepEqual(choisir("1.0.1", "1.0.2"), { aMontrer: null, aNoterSansMontrer: null });
});

test("première ouverture sans compte (installation neuve) : on note la version sans rien montrer", () => {
  assert.deepEqual(choisir("1.0.2", null, false), { aMontrer: null, aNoterSansMontrer: "1.0.2" });
});

test("rien de noté mais déjà inscrit (mise à jour depuis une version sans les nouveautés) : on les montre", () => {
  assert.equal(choisir("1.0.2", null, true).aMontrer?.version, "1.0.2");
});

test("version sans nouveautés écrites : notée sans fenêtre", () => {
  assert.deepEqual(choisir("1.0.3", "1.0.2"), { aMontrer: null, aNoterSansMontrer: "1.0.3" });
});

test("version installée inconnue (web) : rien", () => {
  assert.deepEqual(choisir(null, "1.0.1"), { aMontrer: null, aNoterSansMontrer: null });
});

test("les nouveautés de l'app : versions lisibles, uniques, de la plus récente à la plus ancienne", () => {
  assert.ok(NOUVEAUTES_VERSIONS.length > 0);
  const vues = new Set();
  for (const [i, n] of NOUVEAUTES_VERSIONS.entries()) {
    assert.notEqual(lirePartiesVersion(n.version), null, n.version);
    assert.ok(!vues.has(n.version), `${n.version} en double`);
    vues.add(n.version);
    if (i > 0) assert.equal(comparerVersions(NOUVEAUTES_VERSIONS[i - 1].version, n.version), 1, `${NOUVEAUTES_VERSIONS[i - 1].version} avant ${n.version}`);
    assert.ok(n.titre.trim().length > 0 && n.libelle.trim().length > 0, n.version);
    assert.ok(n.points.length > 0, `${n.version} sans point`);
    for (const p of n.points) assert.ok(p.emoji && p.titre.trim() && p.detail.trim(), `${n.version} : point incomplet`);
  }
});
