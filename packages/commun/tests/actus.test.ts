import { test } from "node:test";
import assert from "node:assert/strict";

import { calculerMinutesLecture } from "../src/fonctions/actus/calculer-minutes-lecture.ts";
import { BADGES_ACTUS, LIEUX_RUBRIQUE_ACTUS, RUBRIQUES_ACTUS } from "../src/regles/actus.ts";

test("actus : chaque rubrique a ses bornes de lieux, du plus petit au plus grand", () => {
  for (const rubrique of RUBRIQUES_ACTUS) {
    const { min, max } = LIEUX_RUBRIQUE_ACTUS[rubrique];
    assert.ok(min >= 1 && min <= max, rubrique);
  }
});

test("actus : les badges arrivent dans l'ordre (1, 5, 20 articles)", () => {
  assert.deepEqual(BADGES_ACTUS.map((b) => b.objectif), [1, 5, 20]);
});

test("actus : durée de lecture, au moins une minute, 200 mots par minute", () => {
  assert.equal(calculerMinutesLecture([]), 1);
  assert.equal(calculerMinutesLecture(["un deux trois"]), 1);
  assert.equal(calculerMinutesLecture([Array(600).fill("mot").join(" ")]), 3);
  assert.equal(calculerMinutesLecture(["  mot  ", Array(399).fill("mot").join("\n")]), 2);
});
