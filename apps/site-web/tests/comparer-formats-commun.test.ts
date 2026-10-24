import assert from "node:assert/strict";
import { test } from "node:test";

import { ecrireDateLangue } from "../../../packages/commun/src/fonctions/langue/ecrire-date-langue.ts";
import { ecrireMoisLangue } from "../../../packages/commun/src/fonctions/langue/ecrire-mois-langue.ts";
import { formaterPrixLangue } from "../../../packages/commun/src/fonctions/langue/formater-prix-langue.ts";
import { formaterJourEnLettres } from "../src/fonctions/dates/formater-jour-en-lettres.ts";
import { formaterMoisEnLettres } from "../src/fonctions/dates/formater-mois-en-lettres.ts";
import { formaterPrix } from "../src/fonctions/prix/formater-prix.ts";

const deux = (n: number) => String(n).padStart(2, "0");

test("jours : ecrireDateLangue(…, \"fr\") rend exactement formaterJourEnLettres du site", () => {
  for (const annee of [1950, 2004, 2025, 2026, 2030])
    for (let mois = 1; mois <= 12; mois++)
      for (let jour = 1; jour <= 31; jour++)
        assert.equal(ecrireDateLangue({ annee, mois, jour }, "fr"), formaterJourEnLettres(`${annee}-${deux(mois)}-${deux(jour)}`), `${annee}-${mois}-${jour}`);
});

test("mois : ecrireMoisLangue(…, \"fr\") rend exactement formaterMoisEnLettres du site", () => {
  for (let annee = 1990; annee <= 2040; annee++)
    for (let mois = 1; mois <= 12; mois++) assert.equal(ecrireMoisLangue({ annee, mois }, "fr"), formaterMoisEnLettres(`${annee}-${deux(mois)}`), `${annee}-${mois}`);
});

test("prix au centime : formaterPrixLangue(…, \"fr\") rend exactement formaterPrix du site", () => {
  for (let k = 0; k <= 200_000; k += 7) assert.equal(formaterPrixLangue(k / 100, "fr"), formaterPrix(k / 100), String(k / 100));
  for (const prix of [1e3, 1e4, 1e5, 1e6, 12_345_678, 999_999.99, 0.5, 0.05]) assert.equal(formaterPrixLangue(prix, "fr"), formaterPrix(prix), String(prix));
});
