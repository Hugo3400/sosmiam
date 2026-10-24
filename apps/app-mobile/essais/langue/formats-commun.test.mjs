import assert from "node:assert/strict";
import { test } from "node:test";

import { ecrireDateLangue } from "@sos-miam/commun/fonctions/langue/ecrire-date-langue.ts";
import { ecrireMoisLangue } from "@sos-miam/commun/fonctions/langue/ecrire-mois-langue.ts";
import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue.ts";
import { formaterPrixLangue } from "@sos-miam/commun/fonctions/langue/formater-prix-langue.ts";
import { nommerJourLangue } from "@sos-miam/commun/fonctions/langue/nommer-jour-langue.ts";
import { ecrireHeureEspacee } from "~/fonctions/dates/ecrire-heure-espacee";
import { ecrireMoisAnnee } from "~/fonctions/dates/ecrire-mois-annee";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterMomentRelatif } from "~/fonctions/dates/formater-moment-relatif";
import { formaterPrix } from "~/fonctions/prix/formater-prix";

const deux = (n) => String(n).padStart(2, "0");

test("prix : formaterPrixLangue(…, \"fr\") rend exactement formaterPrix de l'app", () => {
  const montants = [];
  for (let k = 0; k <= 200_000; k += 7) montants.push(k / 100);
  for (const n of [1e3, 1e4, 1e5, 1e6, 12_345_678, 999_999.99, 0.5, 0.05, 4.001, 4.999, 10.995, 1.005]) montants.push(n);
  for (const prix of montants) assert.equal(formaterPrixLangue(prix, "fr"), formaterPrix(prix), String(prix));
});

test("heures : formaterHeureLangue rend formaterHeure et ecrireHeureEspacee de l'app", () => {
  for (let h = 0; h < 24; h++)
    for (let m = 0; m < 60; m++) {
      assert.equal(formaterHeureLangue(h, m, "fr"), formaterHeure(`${deux(h)}:${deux(m)}`), `${h}:${m}`);
      assert.equal(formaterHeureLangue(h, m, "fr", { espacee: true }), ecrireHeureEspacee(new Date(2026, 9, 24, h, m)), `${h}:${m}`);
    }
});

test("dates : ecrireDateLangue et ecrireMoisLangue rendent formaterDateLongue et ecrireMoisAnnee de l'app", () => {
  for (const annee of [1950, 2004, 2025, 2026, 2030])
    for (let mois = 1; mois <= 12; mois++) {
      assert.equal(ecrireMoisLangue({ annee, mois }, "fr"), ecrireMoisAnnee(`${annee}-${deux(mois)}`));
      for (let jour = 1; jour <= 31; jour++)
        assert.equal(ecrireDateLangue({ annee, mois, jour }, "fr"), formaterDateLongue(`${annee}-${deux(mois)}-${deux(jour)}`), `${annee}-${mois}-${jour}`);
    }
});

test("moments : jours et mois courts identiques à formaterMomentRelatif de l'app", () => {
  const maintenant = new Date(2026, 9, 24, 12, 0);
  for (let ecart = 2; ecart <= 800; ecart++) {
    const date = new Date(2026, 9, 24 - ecart, 10, 0);
    const { court } = formaterMomentRelatif(date.toISOString(), maintenant);
    const attendu =
      ecart < 7
        ? nommerJourLangue(date.getDay(), "fr", true)
        : ecrireDateLangue({ annee: date.getFullYear(), mois: date.getMonth() + 1, jour: date.getDate() }, "fr", { court: true, sansAnnee: date.getFullYear() === 2026 });
    assert.equal(attendu, court, date.toISOString());
  }
});
