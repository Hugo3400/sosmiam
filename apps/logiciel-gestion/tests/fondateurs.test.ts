// Tests des fondateurs par ville dans le logiciel : titre de la carte, fondateurs rangés par zone, filtre des zones.
import assert from "node:assert/strict";
import { test } from "node:test";

import { decrireNumerosFondateur } from "../src/fonctions/fondateurs/decrire-numeros-fondateur.ts";
import { filtrerZonesFondateurs } from "../src/fonctions/fondateurs/filtrer-zones-fondateurs.ts";
import { grouperCandidaturesParZone } from "../src/fonctions/fondateurs/grouper-candidatures-par-zone.ts";
import { simplifierNom } from "../src/fonctions/texte/simplifier-nom.ts";
import type { Candidature, ZoneCourte, ZoneFondateurs } from "../src/services/fondateurs.ts";

const LYON: ZoneCourte = { code: "69123", type: "ville", nom: "Lyon", nomAvecDe: "de Lyon", places: 10 };
const ANGERS: ZoneCourte = { code: "49007", type: "ville", nom: "Angers", nomAvecDe: "d'Angers", places: 3 };
const CREUSE: ZoneCourte = { code: "D23", type: "departement", nom: "Creuse", nomAvecDe: "de la Creuse", places: 1 };

const candidature = (id: number, zone: ZoneCourte | null, numeroLocal: number | null, creeLe = "2026-10-09T10:00:00Z"): Candidature => ({
  id, compteId: id, pepites: "", envies: "", reseaux: null, motivation: "", partantRencontre: false, connuPar: null,
  statut: numeroLocal ? "acceptee" : "en-attente", communeCode: null, zoneCode: zone?.code ?? null,
  numeroLocal, numeroNational: numeroLocal ? 100 + id : null, creeLe, reponduLe: null, zone,
});

test("titre de la carte : « Fondateur n° 3 de Lyon · n° 147 en France », avec le bon « de »", () => {
  assert.equal(decrireNumerosFondateur({ numeroLocal: 3, numeroNational: 147, zone: LYON }), "Fondateur n° 3 de Lyon · n° 147 en France");
  assert.equal(decrireNumerosFondateur({ numeroLocal: 1, numeroNational: 2, zone: ANGERS }), "Fondateur n° 1 d'Angers · n° 2 en France");
  assert.equal(decrireNumerosFondateur({ numeroLocal: 1, numeroNational: 9, zone: CREUSE }), "Fondateur n° 1 de la Creuse · n° 9 en France");
  assert.equal(decrireNumerosFondateur({ numeroLocal: null, numeroNational: null, zone: LYON }), null);
});

test("fondateurs rangés par zone : villes puis départements (ordre alphabétique), sans zone à la fin, par numéro", () => {
  const groupes = grouperCandidaturesParZone([
    candidature(1, CREUSE, 1), candidature(2, LYON, 11), candidature(3, null, null), candidature(4, ANGERS, 1), candidature(5, LYON, 2),
  ]);
  assert.deepEqual(groupes.map((g) => g.zone?.nom ?? "sans zone"), ["Angers", "Lyon", "Creuse", "sans zone"]);
  assert.deepEqual(groupes[1]?.candidatures.map((c) => c.numeroLocal), [2, 11]);
});

const zone = (nom: string, type: "ville" | "departement", codeDepartement: string, places: number, prises: number, enAttente = 0): ZoneFondateurs => ({
  code: nom, type, nom, nomAvecDe: `de ${nom}`, places, codeDepartement, population: 1, prochainNumero: prises + 1, prises, enAttente, souvenirs: 0,
});

test("filtre des zones : type, actives, complètes, recherche sans accents et par département", () => {
  const zones = [zone("Saint-Étienne", "ville", "42", 3, 3), zone("Lyon", "ville", "69", 10, 0, 2), zone("Rhône", "departement", "69", 1, 0), zone("La Réunion", "departement", "974", 1, 0)];
  assert.deepEqual(filtrerZonesFondateurs(zones, "departements", "").map((z) => z.nom), ["Rhône", "La Réunion"]);
  assert.deepEqual(filtrerZonesFondateurs(zones, "actives", "").map((z) => z.nom), ["Saint-Étienne", "Lyon"]);
  assert.deepEqual(filtrerZonesFondateurs(zones, "completes", "").map((z) => z.nom), ["Saint-Étienne"]);
  assert.deepEqual(filtrerZonesFondateurs(zones, "toutes", "saint etienne").map((z) => z.nom), ["Saint-Étienne"]);
  assert.deepEqual(filtrerZonesFondateurs(zones, "toutes", "69").map((z) => z.nom), ["Lyon", "Rhône"]);
  assert.deepEqual(filtrerZonesFondateurs(zones, "toutes", "974").map((z) => z.nom), ["La Réunion"]);
});

test("noms simplifiés pour comparer : accents, tirets, apostrophes", () => {
  assert.equal(simplifierNom("Saint-Étienne"), "saint etienne");
  assert.equal(simplifierNom("  L'Haÿ-les-Roses "), "l hay les roses");
});
