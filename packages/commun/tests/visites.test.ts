import { test } from "node:test";
import assert from "node:assert/strict";
import type { EtatVisitePourTransition, EvenementVisite, StatutVisite } from "../src/types/visite.ts";
import { calculerEffetsValidation } from "../src/fonctions/visites/calculer-effets-validation.ts";
import { calculerOuvertureAvis } from "../src/fonctions/visites/calculer-ouverture-avis.ts";
import { calculerPointsVisite } from "../src/fonctions/visites/calculer-points-visite.ts";
import { choisirCodeAddition } from "../src/fonctions/visites/choisir-code-addition.ts";
import { decrireEtatAvis } from "../src/fonctions/visites/decrire-etat-avis.ts";
import { faireEvoluerVisite } from "../src/fonctions/visites/faire-evoluer-visite.ts";
import { verifierDroitValidation } from "../src/fonctions/visites/verifier-droit-validation.ts";
import { remplirModele } from "../src/fonctions/texte/remplir-modele.ts";

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;
const JOUR = 24 * HEURE;
const T0 = Date.parse("2026-10-09T19:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();

const EVENEMENTS: EvenementVisite[] = [
  { type: "regler" },
  { type: "refuser", motif: "introuvable" },
  { type: "annuler-client" },
  { type: "expirer" },
  { type: "annuler-lieu", motif: "pas-venu" },
  { type: "retirer" },
];

/** Une addition demandée à T0, qui expire 30 min plus tard */
const demandee = (pendantSos = false): EtatVisitePourTransition => ({
  statut: "demandee", expireLe: iso(T0 + 30 * MINUTE), valideLe: null, pendantSos, points: 0, tampon: false,
});
/** Une visite validée à T0 */
const validee = (points = 15, tampon = true): EtatVisitePourTransition => ({
  statut: "validee", expireLe: iso(T0 + 30 * MINUTE), valideLe: iso(T0), pendantSos: points === 25, points, tampon,
});

test("points d'une visite : 15, ou 25 pendant un SOS", () => {
  assert.equal(calculerPointsVisite(false), 15);
  assert.equal(calculerPointsVisite(true), 25);
});

test("regler : validée, points, tampon, avis ouvert 1 h après et pour 14 jours, annulable 15 min", () => {
  const maintenant = T0 + 5 * MINUTE;
  const t = faireEvoluerVisite(demandee(), { type: "regler" }, maintenant);
  assert.deepEqual(t, {
    ok: true,
    statut: "validee",
    valideLe: iso(maintenant),
    decideLe: iso(maintenant),
    points: 15,
    annulableJusqua: iso(maintenant + 15 * MINUTE),
    effets: [
      { type: "points", valeur: 15, raison: "visite" },
      { type: "tampon", delta: 1 },
      { type: "ouvrir-avis", ouvertLe: iso(maintenant + HEURE), fermeLe: iso(maintenant + HEURE + 14 * JOUR) },
    ],
  });
});

test("regler pendant un SOS : 25 points ; avis en accéléré", () => {
  const t = faireEvoluerVisite(demandee(true), { type: "regler" }, T0, { delaiAvisMs: MINUTE });
  assert.ok(t.ok);
  assert.equal(t.points, 25);
  assert.deepEqual(t.effets[0], { type: "points", valeur: 25, raison: "visite-sos" });
  assert.deepEqual(t.effets[2], { type: "ouvrir-avis", ouvertLe: iso(T0 + MINUTE), fermeLe: iso(T0 + MINUTE + 14 * JOUR) });
});

test("regler après expireLe (ou pile à expireLe) : delai-depasse", () => {
  assert.deepEqual(faireEvoluerVisite(demandee(), { type: "regler" }, T0 + 30 * MINUTE), { ok: false, erreur: "delai-depasse" });
  assert.deepEqual(faireEvoluerVisite(demandee(), { type: "regler" }, T0 + 31 * MINUTE), { ok: false, erreur: "delai-depasse" });
  assert.equal(faireEvoluerVisite(demandee(), { type: "regler" }, T0 + 30 * MINUTE - 1).ok, true);
  const illisible = { ...demandee(), expireLe: "bientôt" };
  assert.deepEqual(faireEvoluerVisite(illisible, { type: "regler" }, T0), { ok: false, erreur: "delai-depasse" });
});

test("refuser, annuler-client et expirer depuis demandee", () => {
  const refus = faireEvoluerVisite(demandee(), { type: "refuser", motif: "doublon" }, T0 + MINUTE);
  assert.deepEqual(refus, {
    ok: true, statut: "refusee", valideLe: null, decideLe: iso(T0 + MINUTE), points: 0, annulableJusqua: null,
    effets: [{ type: "controle", motif: "refus-lieu" }],
  });
  const annulation = faireEvoluerVisite(demandee(), { type: "annuler-client" }, T0 + MINUTE);
  assert.ok(annulation.ok);
  assert.equal(annulation.statut, "annulee");
  assert.deepEqual(annulation.effets, []);
  const expiration = faireEvoluerVisite(demandee(), { type: "expirer" }, T0 + 30 * MINUTE);
  assert.ok(expiration.ok);
  assert.equal(expiration.statut, "expiree");
  assert.deepEqual(expiration.effets, []);
});

test("expirer avant expireLe : transition-interdite", () => {
  assert.deepEqual(faireEvoluerVisite(demandee(), { type: "expirer" }, T0 + 29 * MINUTE), { ok: false, erreur: "transition-interdite" });
});

test("chaque transition interdite", () => {
  const permises: Partial<Record<StatutVisite, EvenementVisite["type"][]>> = {
    demandee: ["regler", "refuser", "annuler-client", "expirer"],
    validee: ["annuler-lieu", "retirer"],
  };
  const statuts: StatutVisite[] = ["demandee", "validee", "refusee", "annulee", "expiree", "retiree"];
  for (const statut of statuts) {
    for (const evenement of EVENEMENTS) {
      if (permises[statut]?.includes(evenement.type)) continue;
      const etat = { ...validee(), statut };
      const t = faireEvoluerVisite(etat, evenement, T0 + 31 * MINUTE);
      assert.deepEqual(t, { ok: false, erreur: "transition-interdite" }, `${statut} + ${evenement.type}`);
    }
  }
});

test("annuler-lieu : acceptée à 15 min pile, delai-depasse à 15 min + 1 s", () => {
  const motif = { type: "annuler-lieu", motif: "pas-venu" } as const;
  const aQuinze = faireEvoluerVisite(validee(), motif, T0 + 15 * MINUTE);
  assert.deepEqual(aQuinze, {
    ok: true, statut: "retiree", valideLe: iso(T0), decideLe: iso(T0 + 15 * MINUTE), points: 0, annulableJusqua: null,
    effets: [
      { type: "points", valeur: -15, raison: "annulation-visite" },
      { type: "tampon", delta: -1 },
      { type: "masquer-avis" },
      { type: "controle", motif: "annulation-lieu" },
    ],
  });
  assert.deepEqual(faireEvoluerVisite(validee(), motif, T0 + 15 * MINUTE + 1_000), { ok: false, erreur: "delai-depasse" });
});

test("retirer (équipe SOS Miam) : effets inverses exacts, à tout moment, sans contrôle", () => {
  const avecSos = faireEvoluerVisite(validee(25, true), { type: "retirer" }, T0 + 30 * JOUR);
  assert.ok(avecSos.ok);
  assert.equal(avecSos.statut, "retiree");
  assert.equal(avecSos.points, 0);
  assert.deepEqual(avecSos.effets, [
    { type: "points", valeur: -25, raison: "annulation-visite" },
    { type: "tampon", delta: -1 },
    { type: "masquer-avis" },
  ]);
  const sansTampon = faireEvoluerVisite(validee(15, false), { type: "retirer" }, T0 + HEURE);
  assert.ok(sansTampon.ok);
  assert.deepEqual(sansTampon.effets, [{ type: "points", valeur: -15, raison: "annulation-visite" }, { type: "masquer-avis" }]);
});

test("regler puis retirer : la somme des points et des tampons revient à zéro", () => {
  for (const pendantSos of [false, true]) {
    const reglee = faireEvoluerVisite(demandee(pendantSos), { type: "regler" }, T0);
    assert.ok(reglee.ok);
    const etat: EtatVisitePourTransition = {
      statut: reglee.statut, expireLe: demandee().expireLe, valideLe: reglee.valideLe, pendantSos, points: reglee.points, tampon: true,
    };
    const retiree = faireEvoluerVisite(etat, { type: "retirer" }, T0 + MINUTE);
    assert.ok(retiree.ok);
    const effets = [...reglee.effets, ...retiree.effets];
    const somme = (type: "points" | "tampon") =>
      effets.reduce((total, e) => total + (e.type === "points" && type === "points" ? e.valeur : e.type === "tampon" && type === "tampon" ? e.delta : 0), 0);
    assert.equal(somme("points"), 0);
    assert.equal(somme("tampon"), 0);
  }
});

test("calculerEffetsValidation et calculerOuvertureAvis", () => {
  assert.deepEqual(calculerOuvertureAvis(T0), { ouvertLe: iso(T0 + HEURE), fermeLe: iso(T0 + HEURE + 14 * JOUR) });
  assert.deepEqual(calculerEffetsValidation(false, T0).map((e) => e.type), ["points", "tampon", "ouvrir-avis"]);
});

test("choisirCodeAddition évite les codes pris et complète par des zéros", () => {
  const tirages = [5307, 5307, 42];
  assert.equal(choisirCodeAddition(new Set(["5307"]), () => tirages.shift() ?? 0), "0042");
  assert.equal(choisirCodeAddition(new Set(), () => 7), "0007");
  const horsBornes = [10_000, -1, 2.5, 1234];
  assert.equal(choisirCodeAddition(new Set(), () => horsBornes.shift() ?? 0), "1234");
  assert.throws(() => choisirCodeAddition(new Set(["0001"]), () => 1));
});

test("verifierDroitValidation : ordre des contrôles", () => {
  const base = {
    lieu: { id: 5, type: "bar" as const, validationActive: true },
    compte: { majeur: true, limiteJusqua: null, lieuxMembre: [] as number[] },
    maintenantMs: T0,
  };
  assert.deepEqual(verifierDroitValidation(base), { ok: true });
  const toutFaux = {
    lieu: { ...base.lieu, validationActive: false },
    compte: { majeur: false, limiteJusqua: iso(T0 + JOUR), lieuxMembre: [5] },
    maintenantMs: T0,
  };
  assert.deepEqual(verifierDroitValidation(toutFaux), { ok: false, erreur: "lieu-sans-validation" });
  const etape2 = { ...toutFaux, lieu: base.lieu };
  assert.deepEqual(verifierDroitValidation(etape2), { ok: false, erreur: "mineur-bar" });
  const etape3 = { ...etape2, compte: { ...toutFaux.compte, majeur: true } };
  assert.deepEqual(verifierDroitValidation(etape3), { ok: false, erreur: "compte-limite" });
  const etape4 = { ...etape3, compte: { ...etape3.compte, limiteJusqua: iso(T0 - 1) } };
  assert.deepEqual(verifierDroitValidation(etape4), { ok: false, erreur: "membre-du-lieu" });
  const restoMineur = { ...base, lieu: { ...base.lieu, type: "resto" as const }, compte: { ...base.compte, majeur: false } };
  assert.deepEqual(verifierDroitValidation(restoMineur), { ok: true });
  const pauseIllisible = { ...base, compte: { ...base.compte, limiteJusqua: "un jour" } };
  assert.deepEqual(verifierDroitValidation(pauseIllisible), { ok: false, erreur: "compte-limite" });
});

test("decrireEtatAvis", () => {
  const avis = { ouvertLe: iso(T0 + HEURE), fermeLe: iso(T0 + HEURE + 14 * JOUR), donne: false };
  assert.equal(decrireEtatAvis(null, T0), "aucun");
  assert.equal(decrireEtatAvis(avis, T0), "a-venir");
  assert.equal(decrireEtatAvis(avis, T0 + HEURE), "ouvert");
  assert.equal(decrireEtatAvis(avis, T0 + HEURE + 14 * JOUR), "ferme");
  assert.equal(decrireEtatAvis({ ...avis, donne: true }, T0 + 2 * HEURE), "donne");
});

test("remplirModele", () => {
  assert.equal(
    remplirModele("On te situe à environ {distance} de {lieu}.", { distance: "1,2 km", lieu: "Chez Nonna Lia" }),
    "On te situe à environ 1,2 km de Chez Nonna Lia.",
  );
  assert.equal(remplirModele("Pause jusqu'au {date}", {}), "Pause jusqu'au {date}");
  assert.equal(remplirModele("{lieu} et {lieu}", { lieu: "Le $& Bar" }), "Le $& Bar et Le $& Bar");
  assert.equal(remplirModele("{constructor}", {}), "{constructor}");
});
