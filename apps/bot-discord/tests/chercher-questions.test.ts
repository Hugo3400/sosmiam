import assert from "node:assert/strict";
import { test } from "node:test";
import { QUESTIONS_FAQ } from "../src/contenus/questions-faq.ts";
import { chercherQuestions } from "../src/fonctions/texte/chercher-questions.ts";
import { normaliserTexte } from "../src/fonctions/texte/normaliser-texte.ts";

const questions = [
  { question: "C'est gratuit ?", reponse: "Oui, pour toujours." },
  { question: "Combien ça coûte ?", reponse: "Rien.", motsCles: ["prix", "tarif"] },
  { question: "C'est quoi, une rescousse ?", reponse: "Ton coup de pouce, rechargé chaque lundi." },
  { question: "Dans quelles villes ?", reponse: "Montpellier et l'Hérault, puis les autres villes une par une." },
];

test("normaliserTexte enlève accents, majuscules et ponctuation", () => {
  assert.equal(normaliserTexte("  C'est GRATUIT, l'Hérault ?! "), "c est gratuit l herault");
});

test("une saisie vide renvoie les premières questions, dans l'ordre", () => {
  assert.deepEqual(chercherQuestions(questions, "   ", 2), questions.slice(0, 2));
});

test("la recherche ignore les accents et accepte les mots incomplets", () => {
  assert.equal(chercherQuestions(questions, "COUTE")[0], questions[1]);
  assert.equal(chercherQuestions(questions, "rescou")[0], questions[2]);
  assert.equal(chercherQuestions(questions, "herault")[0], questions[3]);
});

test("les mots-clés trouvent une question qui ne contient pas le mot", () => {
  assert.equal(chercherQuestions(questions, "prix")[0], questions[1]);
});

test("un mot dans la question passe avant un mot dans la réponse", () => {
  // « villes » est dans le titre de la question 4 et seulement dans aucune autre : elle sort en premier.
  assert.equal(chercherQuestions(questions, "villes")[0], questions[3]);
  // « lundi » n'est que dans une réponse : la question est quand même trouvée.
  assert.deepEqual(chercherQuestions(questions, "lundi"), [questions[2]]);
});

test("aucune correspondance : liste vide", () => {
  assert.deepEqual(chercherQuestions(questions, "kangourou"), []);
});

test("les questions de /faq respectent les limites de Discord", () => {
  const ids = QUESTIONS_FAQ.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, "deux questions ont le même id");
  for (const q of QUESTIONS_FAQ) {
    assert.ok(q.id.length <= 100, `id trop long : ${q.id}`);
    assert.ok(q.question.length <= 95, `question trop longue pour l'autocomplétion : ${q.question}`);
    assert.ok(q.reponse.length <= 3500, `réponse trop longue : ${q.id}`);
  }
});
