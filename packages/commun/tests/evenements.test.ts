import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerProchaineOccurrence } from "../src/fonctions/evenements/calculer-prochaine-occurrence.ts";
import { contientOpenBar } from "../src/fonctions/evenements/contient-open-bar.ts";
import { estEvenementAlcool } from "../src/fonctions/evenements/est-evenement-alcool.ts";
import { listerOccurrencesEvenement } from "../src/fonctions/evenements/lister-occurrences-evenement.ts";
import type { ReglageEvenement } from "../src/types/evenement.ts";
import { validerEvenement } from "../src/validation/valider-evenement.ts";

// Vendredi 9 octobre 2026, 12 h à Paris (heure d'été : Paris = UTC + 2 jusqu'au 25 octobre)
const MAINTENANT = new Date("2026-10-09T10:00:00Z");
const iso = (d: { debut: Date; fin: Date | null }) => [d.debut.toISOString(), d.fin?.toISOString() ?? null];

/** Un quiz le jeudi 15 octobre à 20 h (Paris), jusqu'à 22 h */
const QUIZ: ReglageEvenement = {
  titre: "Quiz musical du jeudi", type: "quiz", description: "Viens avec ta bande, on fournit les buzzers.",
  debut: "2026-10-15T18:00:00.000Z", fin: "2026-10-15T20:00:00.000Z", hebdoJusqua: null,
  tarif: "gratuit", prixCentimes: null, places: null, alcool: false,
};
const valider = (changements: Record<string, unknown>, garde: string | null = null) => validerEvenement({ ...QUIZ, ...changements }, MAINTENANT, garde);
const champ = (changements: Record<string, unknown>) => {
  const r = valider(changements);
  return r.ok ? null : r.champ;
};

test("occurrences : chaque semaine à la même heure de Paris, changement d'heure compris, jusqu'à hebdoJusqua", () => {
  const hebdo = { debut: QUIZ.debut, fin: QUIZ.fin, hebdoJusqua: "2026-11-12T22:00:00.000Z" };
  const toutes = listerOccurrencesEvenement(hebdo, MAINTENANT, new Date("2027-01-01T00:00:00Z")).map(iso);
  assert.deepEqual(toutes, [
    ["2026-10-15T18:00:00.000Z", "2026-10-15T20:00:00.000Z"],
    ["2026-10-22T18:00:00.000Z", "2026-10-22T20:00:00.000Z"],
    // Heure d'hiver depuis le 25 octobre : toujours 20 h à Paris
    ["2026-10-29T19:00:00.000Z", "2026-10-29T21:00:00.000Z"],
    ["2026-11-05T19:00:00.000Z", "2026-11-05T21:00:00.000Z"],
    ["2026-11-12T19:00:00.000Z", "2026-11-12T21:00:00.000Z"],
  ]);
  // Une période : seulement les dates qui la touchent
  const periode = listerOccurrencesEvenement(hebdo, new Date("2026-10-20T00:00:00Z"), new Date("2026-11-01T00:00:00Z")).map(iso);
  assert.deepEqual(periode.map(([debut]) => debut), ["2026-10-22T18:00:00.000Z", "2026-10-29T19:00:00.000Z"]);
  // Une seule fois
  assert.equal(listerOccurrencesEvenement({ ...hebdo, hebdoJusqua: null }, MAINTENANT, new Date("2027-01-01T00:00:00Z")).length, 1);
  // Une date déjà commencée qui touche le début de la période compte
  assert.equal(listerOccurrencesEvenement(hebdo, new Date("2026-10-15T19:00:00Z"), new Date("2026-10-15T23:00:00Z")).length, 1);
});

test("prochaine occurrence : celle en cours, la suivante, ou rien (sans fin : 3 h)", () => {
  const hebdo = { debut: QUIZ.debut, fin: QUIZ.fin, hebdoJusqua: "2026-10-22T21:00:00.000Z" };
  assert.equal(calculerProchaineOccurrence(hebdo, MAINTENANT)?.debut.toISOString(), "2026-10-15T18:00:00.000Z");
  // Pendant le quiz : celui-ci ; juste après : la semaine suivante
  assert.equal(calculerProchaineOccurrence(hebdo, new Date("2026-10-15T19:59:00Z"))?.debut.toISOString(), "2026-10-15T18:00:00.000Z");
  assert.equal(calculerProchaineOccurrence(hebdo, new Date("2026-10-15T20:00:00Z"))?.debut.toISOString(), "2026-10-22T18:00:00.000Z");
  assert.equal(calculerProchaineOccurrence(hebdo, new Date("2026-10-22T20:00:00Z")), null);
  const sansFin = { debut: QUIZ.debut, fin: null, hebdoJusqua: null };
  assert.deepEqual(iso(calculerProchaineOccurrence(sansFin, new Date("2026-10-15T20:59:00Z"))!), ["2026-10-15T18:00:00.000Z", null]);
  assert.equal(calculerProchaineOccurrence(sansFin, new Date("2026-10-15T21:00:00Z")), null);
});

test("validerEvenement : un événement juste, nettoyé", () => {
  const r = validerEvenement(
    { ...QUIZ, titre: "  Quiz   musical  ", description: "Ligne 1  \r\n\r\n\r\n\r\n  Ligne   2 ", debut: "2026-10-15T20:00:42+02:00", fin: undefined, prixCentimes: 900 },
    MAINTENANT,
  );
  assert.deepEqual(r, {
    ok: true,
    evenement: { ...QUIZ, titre: "Quiz musical", description: "Ligne 1\n\nLigne 2", debut: "2026-10-15T18:00:00.000Z", fin: null, prixCentimes: null },
  });
  // Description absente : vide ; prix gardé pour le tarif « prix » ; places
  const prix = validerEvenement({ ...QUIZ, description: undefined, tarif: "prix", prixCentimes: 1500, places: 40 }, MAINTENANT);
  assert.ok(prix.ok);
  assert.deepEqual([prix.evenement.description, prix.evenement.prixCentimes, prix.evenement.places], ["", 1500, 40]);
});

test("validerEvenement : chaque champ refusé", () => {
  for (const titre of [undefined, "ab", "x".repeat(61), "Quiz des connards", 12]) assert.equal(champ({ titre }), "titre", String(titre));
  for (const type of [undefined, "rave", "Concert"]) assert.equal(champ({ type }), "type", String(type));
  for (const description of ["x".repeat(501), 12, "Ambiance de salope"]) assert.equal(champ({ description }), "description", String(description));
  // Début : passé, au-delà de 3 mois, sans fuseau, illisible
  for (const debut of ["2026-10-09T09:59:00Z", "2027-01-10T10:00:00Z", "2026-10-15T20:00", "jeudi", undefined]) assert.equal(champ({ debut }), "debut", String(debut));
  assert.equal(champ({ debut: "2027-01-09T10:00:00Z", fin: null }), null);
  // Fin : avant ou au début, plus de 24 h, illisible
  for (const fin of ["2026-10-15T17:00:00Z", "2026-10-15T18:00:00Z", "2026-10-16T18:01:00Z", "demain"]) assert.equal(champ({ fin }), "fin", fin);
  // Chaque semaine : au moins une semaine après le début, 3 mois à l'avance au plus
  for (const hebdoJusqua of ["2026-10-20T18:00:00Z", "2027-01-10T10:00:00Z", "bientôt"]) assert.equal(champ({ hebdoJusqua }), "hebdoJusqua", hebdoJusqua);
  assert.equal(champ({ hebdoJusqua: "2027-01-09T10:00:00Z" }), null);
  assert.equal(champ({ tarif: "cher" }), "tarif");
  for (const prixCentimes of [undefined, 0, 50_001, 12.5, "15"]) assert.equal(champ({ tarif: "prix", prixCentimes }), "prixCentimes", String(prixCentimes));
  for (const places of [0, 501, 2.5, "10"]) assert.equal(champ({ places }), "places", String(places));
  assert.equal(champ({ alcool: "oui" }), "alcool");
  assert.equal(validerEvenement("pas un objet", MAINTENANT).ok, false);
});

test("validerEvenement : un début passé n'est gardé que s'il ne change pas (série déjà commencée)", () => {
  const passe = "2026-10-08T18:00:00.000Z";
  const serie = { debut: passe, fin: null, hebdoJusqua: "2026-11-05T18:00:00.000Z" };
  assert.equal(champ(serie), "debut");
  assert.equal(valider(serie, passe).ok, true);
  assert.equal(valider({ ...serie, debut: "2026-10-07T18:00:00.000Z" }, passe).ok, false);
});

test("validerEvenement : alcool coché d'office, et jamais d'open bar", () => {
  const degustation = validerEvenement({ ...QUIZ, type: "degustation", titre: "Dégustation de vins du Languedoc" }, MAINTENANT);
  assert.ok(degustation.ok && degustation.evenement.alcool);
  const happy = validerEvenement({ ...QUIZ, description: "Happy hour pendant le quiz" }, MAINTENANT);
  assert.ok(happy.ok && happy.evenement.alcool);
  assert.ok(valider({}).ok && !(valider({}) as { evenement: ReglageEvenement }).evenement.alcool);
  assert.equal(champ({ titre: "Soirée OPEN-BAR", alcool: true }), "titre");
  assert.equal(champ({ titre: "Soirée open bar" }), null, "sans alcool, « open bar » ne veut rien dire de grave");
  assert.equal(champ({ description: "Bières à volonté toute la soirée" }), "description");
  assert.equal(champ({ titre: "Concert", description: "Cocktails illimités" }), "description");
  // Un repas à volonté sans alcool reste permis, pas avec
  assert.equal(champ({ titre: "Moules-frites à volonté" }), null);
  assert.equal(champ({ titre: "Moules-frites à volonté", alcool: true }), "titre");
});

test("contientOpenBar : boire à volonté, pas un verre offert", () => {
  for (const texte of ["OPEN BAR toute la nuit", "Openbar", "Bière à volonté", "Cocktails illimités", "Les boissons sont gratuites", "Free drinks", "Forfait boissons à 20 €", "Gratuit à boire", "Shots à gogo", "Vin sans limite"]) {
    assert.equal(contientOpenBar(texte), true, texte);
  }
  for (const texte of ["Un verre offert", "Dégustation de 5 vins", "Bar ouvert dès 18 h", "Concert gratuit", "Barbecue illuminé"]) {
    assert.equal(contientOpenBar(texte), false, texte);
  }
});

test("estEvenementAlcool : case, mots d'alcool ou happy hour, ou lieu de type bar", () => {
  const quiz = { alcool: false, titre: "Quiz musical", description: "" };
  assert.equal(estEvenementAlcool(quiz, "resto"), false);
  assert.equal(estEvenementAlcool({ ...quiz, alcool: true }, "resto"), true);
  assert.equal(estEvenementAlcool({ ...quiz, description: "Une pinte offerte au gagnant" }, "resto"), true);
  assert.equal(estEvenementAlcool(quiz, "bar"), true);
});
