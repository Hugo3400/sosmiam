// Tests des fonctions de mise en forme et de l'aperçu des newsletters.
import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerGraduations } from "../src/fonctions/graphiques/calculer-graduations.ts";
import { convertirMarkdown } from "../src/fonctions/newsletter/convertir-markdown.ts";
import { creerHtmlNewsletter } from "../src/fonctions/newsletter/creer-html-newsletter.ts";
import { formaterOctets } from "../src/fonctions/texte/formater-octets.ts";
import { nommerPeriode } from "../src/fonctions/texte/nommer-periode.ts";

const STYLES = { titre1: "t1", titre2: "t2", paragraphe: "p", liste: "l", lien: "a" };

test("le Markdown simple devient du HTML d'e-mail", () => {
  const html = convertirMarkdown("# Bonjour\n\nUn **gros** _petit_ [lien](https://sosmiam.fr).\n\n- un\n- deux", STYLES);
  assert.equal(
    html,
    '<h1 style="t1">Bonjour</h1>\n<p style="p">Un <strong>gros</strong> <em>petit</em> <a href="https://sosmiam.fr" style="a">lien</a>.</p>\n<ul style="l"><li>un</li><li>deux</li></ul>',
  );
});

test("le HTML et les liens dangereux sont neutralisés", () => {
  const html = convertirMarkdown('<script>alert(1)</script> [clic](javascript:alert(1)) "guillemets"', STYLES);
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes('href="javascript'));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("l'e-mail complet rappelle comment se désinscrire", () => {
  const html = creerHtmlNewsletter("Objet <test>", "Salut");
  assert.ok(html.includes("STOP"));
  assert.ok(html.includes("<title>Objet &lt;test></title>"));
});

test("les graduations sont rondes et couvrent le maximum", () => {
  assert.deepEqual(calculerGraduations(0), [0, 1]);
  assert.deepEqual(calculerGraduations(3), [0, 1, 2, 3]);
  assert.deepEqual(calculerGraduations(87), [0, 25, 50, 75, 100]);
  assert.deepEqual(calculerGraduations(1240), [0, 500, 1000, 1500]);
});

test("tailles et périodes lisibles", () => {
  assert.equal(formaterOctets(512), "512 o");
  assert.equal(formaterOctets(3.5 * 1024 * 1024), "3,5 Mo");
  assert.equal(nommerPeriode("2026-S41"), "S41");
  assert.equal(nommerPeriode("2026-S41", true), "Semaine 41 de 2026");
  assert.equal(nommerPeriode("2026"), "2026");
  assert.equal(nommerPeriode("2026-10-08"), "8 oct.");
});
