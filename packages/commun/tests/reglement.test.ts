import { test } from "node:test";
import assert from "node:assert/strict";
import type { EtatVisitePourTransition, ReglementVisite } from "../src/types/visite.ts";
import { calculerEffetsValidation } from "../src/fonctions/visites/calculer-effets-validation.ts";
import { calculerPointsVisite } from "../src/fonctions/visites/calculer-points-visite.ts";
import { decrireReglement } from "../src/fonctions/visites/decrire-reglement.ts";
import { faireEvoluerVisite } from "../src/fonctions/visites/faire-evoluer-visite.ts";
import { validerReglementVisite } from "../src/validation/valider-reglement-visite.ts";

const MINUTE = 60_000;
const T0 = Date.parse("2026-10-09T19:00:00.000Z");
const PAYE: ReglementVisite = { type: "paye", reductionPourcent: null, avantages: [] };
const REDUCTION: ReglementVisite = { type: "reduction", reductionPourcent: 20, avantages: ["happy-hour"] };
const OFFERT: ReglementVisite = { type: "offert", reductionPourcent: null, avantages: ["partenariat"] };

const demandee = (pendantSos = false): EtatVisitePourTransition => ({
  statut: "demandee",
  expireLe: new Date(T0 + 30 * MINUTE).toISOString(),
  valideLe: null,
  pendantSos,
  points: 0,
  tampon: false,
});

test("calculerPointsVisite : offerte = 0, réduction = comme payée", () => {
  assert.equal(calculerPointsVisite(false), 15);
  assert.equal(calculerPointsVisite(true), 25);
  assert.equal(calculerPointsVisite(false, PAYE), 15);
  assert.equal(calculerPointsVisite(true, REDUCTION), 25);
  assert.equal(calculerPointsVisite(false, OFFERT), 0);
  assert.equal(calculerPointsVisite(true, OFFERT), 0);
});

test("calculerEffetsValidation : une visite offerte ouvre seulement l'avis", () => {
  const offerte = calculerEffetsValidation(true, T0, MINUTE, OFFERT);
  assert.deepEqual(offerte.map((e) => e.type), ["ouvrir-avis"]);
  const reduite = calculerEffetsValidation(false, T0, MINUTE, REDUCTION);
  assert.deepEqual(reduite.map((e) => e.type), ["points", "tampon", "ouvrir-avis"]);
});

test("faireEvoluerVisite : régler offerte ne donne ni points ni tampon, et se retire sans rien rendre", () => {
  const t = faireEvoluerVisite(demandee(true), { type: "regler", reglement: OFFERT }, T0);
  assert.equal(t.ok, true);
  if (!t.ok) return;
  assert.equal(t.points, 0);
  assert.deepEqual(t.effets.map((e) => e.type), ["ouvrir-avis"]);
  const retrait = faireEvoluerVisite({ statut: "validee", expireLe: null, valideLe: new Date(T0).toISOString(), pendantSos: true, points: 0, tampon: false }, { type: "annuler-lieu", motif: "autre" }, T0 + MINUTE);
  assert.equal(retrait.ok, true);
  // Rien à rendre : ni points ni tampon n'avaient été donnés
  if (retrait.ok) assert.equal(retrait.effets.some((e) => e.type === "points" || e.type === "tampon"), false);
  const sansPrecision = faireEvoluerVisite(demandee(), { type: "regler" }, T0);
  assert.equal(sansPrecision.ok && sansPrecision.points, 15);
});

test("validerReglementVisite : listes fermées, pourcentage seulement pour une réduction", () => {
  assert.deepEqual(validerReglementVisite(undefined), PAYE);
  assert.deepEqual(validerReglementVisite(null), PAYE);
  assert.deepEqual(validerReglementVisite(REDUCTION), REDUCTION);
  assert.deepEqual(validerReglementVisite({ type: "reduction", reductionPourcent: null, avantages: [] }), { type: "reduction", reductionPourcent: null, avantages: [] });
  assert.deepEqual(validerReglementVisite({ type: "paye", reductionPourcent: 20, avantages: [] }), PAYE);
  assert.deepEqual(validerReglementVisite({ type: "offert", avantages: ["partenariat", "partenariat"] }), OFFERT);
  assert.equal(validerReglementVisite({ type: "gratuit" }), null);
  assert.equal(validerReglementVisite({ type: "reduction", reductionPourcent: 37 }), null);
  assert.equal(validerReglementVisite({ type: "paye", avantages: ["champagne offert"] }), null);
  assert.equal(validerReglementVisite({ type: "paye", avantages: "happy-hour" }), null);
  assert.equal(validerReglementVisite("paye"), null);
  assert.equal(validerReglementVisite([]), null);
});

test("decrireReglement : client et lieu, collaboration commerciale en premier", () => {
  assert.deepEqual(decrireReglement(null, "client"), { titre: "Payée", etiquettes: [], offert: false });
  assert.deepEqual(decrireReglement(REDUCTION, "lieu"), { titre: "Payé avec réduction −20 %", etiquettes: ["Happy hour ou formule"], offert: false });
  const offert = decrireReglement({ type: "offert", reductionPourcent: null, avantages: ["offre-sos", "partenariat"] }, "client");
  assert.equal(offert.titre, "Offerte par le lieu");
  assert.deepEqual(offert.etiquettes, ["Collaboration commerciale", "Offre SOS"]);
  assert.equal(offert.offert, true);
});
