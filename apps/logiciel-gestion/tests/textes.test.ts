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
  const html = creerHtmlNewsletter("Objet <test>", { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Salut" }] }] });
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

import { construireGrilleCreneaux } from "../src/fonctions/statistiques/construire-grille-creneaux.ts";
import { creerCsvStatistiques } from "../src/fonctions/statistiques/creer-csv-statistiques.ts";
import { formaterDuree } from "../src/fonctions/texte/formater-duree.ts";
import { nommerLangue } from "../src/fonctions/texte/nommer-langue.ts";

test("la grille jours × heures range chaque créneau à sa place", () => {
  const { grille, maximum } = construireGrilleCreneaux([{ valeur: "4-21", nombre: 5 }, { valeur: "1-0", nombre: 2 }, { valeur: "9-99", nombre: 7 }]);
  assert.equal(grille[3]?.[21], 5);
  assert.equal(grille[0]?.[0], 2);
  assert.equal(maximum, 5);
  assert.equal(grille.flat().reduce((a, b) => a + b, 0), 7);
});

test("durées et langues lisibles", () => {
  assert.equal(formaterDuree(45), "45 s");
  assert.equal(formaterDuree(155), "2 min 35 s");
  assert.equal(formaterDuree(3900), "1 h 05");
  assert.equal(nommerLangue("fr"), "Français");
  assert.equal(nommerLangue("Inconnue"), "Inconnue");
});

test("l'export CSV des statistiques a une ligne par période puis les classements", () => {
  const csv = creerCsvStatistiques(
    {
      echelle: "jour",
      periodes: [{ cle: "2026-10-08", debut: "2026-10-08", fin: "2026-10-08", vues: 17, visites: 9, visiteurs: 7, visitesFinies: 8, rebonds: 3, dureeVisites: 400, tempsMoyen: 42 }],
      precedentes: [],
      conversions: [{ cle: "2026-10-08", inscriptions: 2, demandes: 1 }],
      details: { page: [{ valeur: "=/piege", nombre: 3 }] },
    },
    { page: "Pages les plus vues" },
  );
  const lignes = csv.replace(/^﻿/, "").trim().split("\r\n");
  assert.equal(lignes[1], "2026-10-08;2026-10-08;2026-10-08;7;9;17;8;3;400;42;2;1");
  assert.equal(lignes[3], "Pages les plus vues;nombre");
  assert.equal(lignes[4], `"'=/piege";3`);
});

import { dateVersSemaine } from "../src/fonctions/dates/date-vers-semaine.ts";
import { semaineVersDimanche } from "../src/fonctions/dates/semaine-vers-dimanche.ts";

test("semaines ISO : d'une date à sa semaine, et d'une semaine à son dimanche", () => {
  assert.equal(dateVersSemaine(new Date(2026, 9, 8)), "2026-W41");
  assert.equal(dateVersSemaine(new Date(2027, 0, 1)), "2026-W53");
  assert.equal(semaineVersDimanche("2026-W41"), "2026-10-11");
  assert.equal(semaineVersDimanche("2026-W01"), "2027-01-04".replace("2027-01-04", "2026-01-04"));
  assert.equal(semaineVersDimanche("pas une semaine"), null);
});

import { creerLienInvitationAmbassadeur } from "../src/fonctions/texte/creer-lien-invitation-ambassadeur.ts";

test("l'invitation ambassadeur : une adresse en destinataire, plusieurs en copie cachée", () => {
  const seule = creerLienInvitationAmbassadeur(["lea@exemple.fr"], "Sète");
  assert.ok(seule.startsWith("mailto:lea%40exemple.fr?subject="));
  assert.ok(decodeURIComponent(seule).includes("(Sète)"));
  assert.ok(decodeURIComponent(seule).includes("https://ambassadeur.sosmiam.fr"));
  const plusieurs = creerLienInvitationAmbassadeur(["a@exemple.fr", "b@exemple.fr"]);
  assert.ok(plusieurs.startsWith("mailto:?subject="));
  assert.ok(plusieurs.endsWith(`&bcc=${encodeURIComponent("a@exemple.fr,b@exemple.fr")}`));
});
