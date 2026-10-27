import { test } from "node:test";
import assert from "node:assert/strict";

import { calculerMinutesLecture } from "../src/fonctions/actus/calculer-minutes-lecture.ts";
import { BADGES_ACTUS, LIEUX_RUBRIQUE_ACTUS, RUBRIQUES_ACTUS } from "../src/regles/actus.ts";
import type { BrouillonArticleActus } from "../src/types/actus.ts";
import { validerArticleActus } from "../src/validation/valider-article-actus.ts";

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

const BROUILLON: BrouillonArticleActus = {
  rubrique: "portrait",
  titre: "La Cabane, les pieds dans l'étang",
  accroche: "Des huîtres du matin et une terrasse sur l'eau.",
  texte: `${"Une belle matinée au bord de l'étang, ".repeat(6)}\n\n${"Et une tarte aux figues pour finir. ".repeat(4)}`,
  citation: "",
  couverture: true,
  photos: 2,
  lieux: [13],
  collaboration: false,
  finLe: null,
};

test("actus : un brouillon complet passe, découpé en paragraphes, sans citation vide", () => {
  const resultat = validerArticleActus(BROUILLON, "2026-10-27");
  assert.equal(resultat.ok, true);
  if (!resultat.ok) return;
  assert.equal(resultat.article.paragraphes.length, 2);
  assert.equal(resultat.article.citation, null);
  assert.equal(resultat.article.finLe, null);
});

test("actus : chaque champ manquant est signalé", () => {
  const resultat = validerArticleActus({ ...BROUILLON, couverture: false, titre: "Court", texte: "Trop court.", collaboration: null, lieux: [] }, "2026-10-27");
  assert.deepEqual(resultat.ok ? [] : resultat.champs, ["couverture", "titre", "texte", "lieux", "collaboration"]);
});

test("actus : bornes de lieux par rubrique, sans doublon", () => {
  const top = { ...BROUILLON, rubrique: "top-quartier" as const };
  assert.equal(validerArticleActus({ ...top, lieux: [1, 4] }, "2026-10-27").ok, false);
  assert.equal(validerArticleActus({ ...top, lieux: [1, 4, 4] }, "2026-10-27").ok, false);
  assert.equal(validerArticleActus({ ...top, lieux: [1, 4, 0] }, "2026-10-27").ok, true);
  assert.equal(validerArticleActus({ ...top, lieux: [1, 2, 3, 4, 5, 6] }, "2026-10-27").ok, false);
});

test("actus : un bon plan a une date de fin après aujourd'hui, dans les 90 jours", () => {
  const bonPlan = { ...BROUILLON, rubrique: "bon-plan" as const };
  assert.equal(validerArticleActus({ ...bonPlan, finLe: null }, "2026-10-27").ok, false);
  assert.equal(validerArticleActus({ ...bonPlan, finLe: "2026-10-27" }, "2026-10-27").ok, false);
  assert.equal(validerArticleActus({ ...bonPlan, finLe: "2026-02-30" }, "2026-10-27").ok, false);
  assert.equal(validerArticleActus({ ...bonPlan, finLe: "2027-02-01" }, "2026-10-27").ok, false);
  const ok = validerArticleActus({ ...bonPlan, finLe: "2026-11-30" }, "2026-10-27");
  assert.equal(ok.ok && ok.article.finLe, "2026-11-30");
});

test("actus : la date de fin d'une autre rubrique est ignorée", () => {
  const resultat = validerArticleActus({ ...BROUILLON, finLe: "2026-11-30" }, "2026-10-27");
  assert.equal(resultat.ok && resultat.article.finLe, null);
});
