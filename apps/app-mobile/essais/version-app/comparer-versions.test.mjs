import assert from "node:assert/strict";
import { test } from "node:test";

import { comparerVersions } from "~/fonctions/version/comparer-versions";
import { lirePartiesVersion } from "~/fonctions/version/lire-parties-version";

test("versions égales", () => {
  assert.equal(comparerVersions("1.2.3", "1.2.3"), 0);
  assert.equal(comparerVersions(" 1.2.3 ", "1.2.3"), 0);
  assert.equal(comparerVersions("0.0.0", "0.0.0"), 0);
});

test("plus récente, plus ancienne : nombre par nombre, jamais comme du texte", () => {
  assert.equal(comparerVersions("1.2.4", "1.2.3"), 1);
  assert.equal(comparerVersions("1.2.3", "1.2.4"), -1);
  assert.equal(comparerVersions("1.10.0", "1.9.9"), 1);
  assert.equal(comparerVersions("2.0.0", "1.99.99"), 1);
  assert.equal(comparerVersions("1.0.10", "1.0.9"), 1);
  assert.equal(comparerVersions("0.9.0", "1.0.0"), -1);
});

test("une partie manquante vaut 0", () => {
  assert.equal(comparerVersions("1", "1.0.0"), 0);
  assert.equal(comparerVersions("1.2", "1.2.0"), 0);
  assert.equal(comparerVersions("1.2", "1.2.1"), -1);
  assert.equal(comparerVersions("2", "1.9.9"), 1);
  assert.deepEqual(lirePartiesVersion("1.2"), [1, 2, 0]);
  assert.deepEqual(lirePartiesVersion("7"), [7, 0, 0]);
});

test("une version mal écrite compte comme 0.0.0", () => {
  for (const mauvaise of ["", "  ", "abc", "1.2.x", "1..2", ".1.2", "1.2.", "1.2.3.4", "v1.2.3", "1.2.3-beta", "-1.0.0", "1,2,3", "1 .2", null, undefined, 3, {}, [], "1234567.0.0"]) {
    assert.equal(lirePartiesVersion(mauvaise), null, String(mauvaise));
    assert.equal(comparerVersions(mauvaise, "0.0.0"), 0, String(mauvaise));
    assert.equal(comparerVersions(mauvaise, "0.0.1"), -1, String(mauvaise));
    assert.equal(comparerVersions("1.0.0", mauvaise), 1, String(mauvaise));
  }
});

test("deux versions mal écrites sont égales", () => {
  assert.equal(comparerVersions("abc", "def"), 0);
  assert.equal(comparerVersions(null, undefined), 0);
});
