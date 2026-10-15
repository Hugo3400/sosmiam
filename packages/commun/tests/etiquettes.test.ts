import { test } from "node:test";
import assert from "node:assert/strict";
import { ETIQUETTES_FILTRE_EXPLORER, FAMILLES_ETIQUETTES } from "../src/contenus/etiquettes-officielles.ts";
import { ajouterPropositionEtiquette } from "../src/fonctions/etiquettes/ajouter-proposition-etiquette.ts";
import { normaliserEtiquette } from "../src/fonctions/etiquettes/normaliser-etiquette.ts";
import { porteEtiquette } from "../src/fonctions/etiquettes/porte-etiquette.ts";
import { trierEtiquettesLieu } from "../src/fonctions/etiquettes/trier-etiquettes-lieu.ts";
import { parleDAlcool } from "../src/fonctions/prevention/parle-d-alcool.ts";
import type { EtiquetteLieu } from "../src/types/etiquette.ts";
import { lireEtiquetteLibre } from "../src/validation/lire-etiquette-libre.ts";

const confirmee = (nom: string): EtiquetteLieu => ({ nom, statut: "confirmee", propositions: 0, parToi: false });
const proposee = (nom: string, propositions: number, parToi = false): EtiquetteLieu => ({ nom, statut: "proposee", propositions, parToi });

test("liste officielle : aucun doublon, aucune étiquette d'alcool, les filtres d'Explorer en font partie", () => {
  const toutes = FAMILLES_ETIQUETTES.flatMap((f) => f.etiquettes);
  assert.equal(new Set(toutes.map(normaliserEtiquette)).size, toutes.length);
  assert.deepEqual(toutes.filter((nom) => nom !== "Sans alcool" && parleDAlcool(nom)), []);
  const officielles = new Set(toutes);
  assert.deepEqual(ETIQUETTES_FILTRE_EXPLORER.filter((nom) => !officielles.has(nom)), []);
  assert.deepEqual(FAMILLES_ETIQUETTES.map((f) => f.id), ["assiette", "ambiance", "pratique", "public"]);
});

test("normaliser : sans accents, sans majuscules, ponctuation en espaces, le + gardé", () => {
  assert.equal(normaliserEtiquette("  Végétarien "), "vegetarien");
  assert.equal(normaliserEtiquette("LGBT+ friendly"), "lgbt+ friendly");
  assert.equal(normaliserEtiquette("Fait-main"), "fait main");
});

test("étiquette libre : une officielle tapée à la main est reconnue", () => {
  assert.deepEqual(lireEtiquetteLibre("vegetarien"), { ok: true, nom: "Végétarien", officielle: true });
  assert.deepEqual(lireEtiquetteLibre("  lgbt+   FRIENDLY "), { ok: true, nom: "LGBT+ friendly", officielle: true });
});

test("étiquette libre : nettoyée, majuscule au début, refusée si vide, trop courte, trop longue, grossière ou alcoolisée", () => {
  assert.deepEqual(lireEtiquetteLibre("  fans   de ramen "), { ok: true, nom: "Fans de ramen", officielle: false });
  assert.deepEqual(lireEtiquetteLibre("   "), { ok: false, refus: "vide" });
  assert.deepEqual(lireEtiquetteLibre("a"), { ok: false, refus: "trop-courte" });
  assert.deepEqual(lireEtiquetteLibre("x".repeat(25)), { ok: false, refus: "trop-longue" });
  assert.deepEqual(lireEtiquetteLibre("x".repeat(24)).ok, true);
  assert.deepEqual(lireEtiquetteLibre("connard"), { ok: false, refus: "mot-interdit" });
  assert.deepEqual(lireEtiquetteLibre("Bière pas chère"), { ok: false, refus: "alcool" });
});

test("proposer : une nouvelle, une déjà proposée (+1, une seule fois), une confirmée (rien ne change)", () => {
  const depart = [confirmee("Calme"), proposee("Vegan", 3)];
  const avecNouvelle = ajouterPropositionEtiquette(depart, "Jeux de société");
  assert.deepEqual(avecNouvelle.at(-1), proposee("Jeux de société", 1, true));
  const avecVegan = ajouterPropositionEtiquette(depart, "vegan");
  assert.deepEqual(avecVegan[1], proposee("Vegan", 4, true));
  assert.equal(ajouterPropositionEtiquette(avecVegan, "Vegan"), avecVegan);
  assert.equal(ajouterPropositionEtiquette(depart, "calme"), depart);
});

test("trier : les confirmées d'abord dans leur ordre, puis les proposées des plus soutenues aux moins soutenues", () => {
  const triees = trierEtiquettesLieu([proposee("Calme", 2), confirmee("Halal"), proposee("Vegan", 6), proposee("Brunch", 2), confirmee("Sans alcool")]);
  assert.deepEqual(triees.map((e) => e.nom), ["Halal", "Sans alcool", "Vegan", "Brunch", "Calme"]);
});

test("porter une étiquette : confirmée ou proposée, sans tenir compte des accents ni des majuscules", () => {
  const etiquettes = [confirmee("Végétarien"), proposee("Petit budget", 1)];
  assert.equal(porteEtiquette(etiquettes, "vegetarien"), true);
  assert.equal(porteEtiquette(etiquettes, "Petit budget"), true);
  assert.equal(porteEtiquette(etiquettes, "Vegan"), false);
});
