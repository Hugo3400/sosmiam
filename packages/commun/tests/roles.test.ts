import { test } from "node:test";
import assert from "node:assert/strict";
import type { RolesCompte } from "../src/types/roles.ts";
import { listerModesOuverts } from "../src/fonctions/roles/lister-modes-ouverts.ts";
import { peutAgirAuComptoir } from "../src/fonctions/roles/peut-agir-au-comptoir.ts";
import { peutOuvrirEspaceAmbassadeur } from "../src/fonctions/roles/peut-ouvrir-espace-ambassadeur.ts";
import { peutReglerLieu } from "../src/fonctions/roles/peut-regler-lieu.ts";

const sansRole: RolesCompte = { ambassadeur: null, pro: [] };
const gerantNonna: RolesCompte = { ambassadeur: "actif", pro: [{ id: 0, nom: "Chez Nonna Lia", emoji: "🍝", role: "gerant" }] };
const equipeNonna: RolesCompte = { ambassadeur: null, pro: [{ id: 0, nom: "Chez Nonna Lia", emoji: "🍝", role: "equipe" }] };

test("un 15-17 ans avec des rôles : « perso » seulement", () => {
  assert.deepEqual(listerModesOuverts(gerantNonna, false), ["perso"]);
  assert.deepEqual(listerModesOuverts(equipeNonna, false), ["perso"]);
  assert.deepEqual(listerModesOuverts({ ambassadeur: "en-attente", pro: [] }, false), ["perso"]);
});

test("un adulte : perso, puis pro et ambassadeur selon ses rôles", () => {
  assert.deepEqual(listerModesOuverts(sansRole, true), ["perso"]);
  assert.deepEqual(listerModesOuverts(gerantNonna, true), ["perso", "pro", "ambassadeur"]);
  assert.deepEqual(listerModesOuverts(equipeNonna, true), ["perso", "pro"]);
});

test("mode ambassadeur : ouvert en attente et suspendu (onglet Espace seul), jamais après un refus", () => {
  assert.deepEqual(listerModesOuverts({ ambassadeur: "en-attente", pro: [] }, true), ["perso", "ambassadeur"]);
  assert.deepEqual(listerModesOuverts({ ambassadeur: "suspendu", pro: [] }, true), ["perso", "ambassadeur"]);
  assert.deepEqual(listerModesOuverts({ ambassadeur: "refuse", pro: [] }, true), ["perso"]);
});

test("comptoir : gérant et équipe du lieu, personne d'autre", () => {
  assert.equal(peutAgirAuComptoir(gerantNonna, 0), true);
  assert.equal(peutAgirAuComptoir(equipeNonna, 0), true);
  assert.equal(peutAgirAuComptoir(gerantNonna, 1), false);
  assert.equal(peutAgirAuComptoir(sansRole, 0), false);
});

test("régler le lieu : le gérant seulement", () => {
  assert.equal(peutReglerLieu(gerantNonna, 0), true);
  assert.equal(peutReglerLieu(equipeNonna, 0), false);
  assert.equal(peutReglerLieu(gerantNonna, 1), false);
});

test("espace ambassadeur complet : actif seulement", () => {
  assert.equal(peutOuvrirEspaceAmbassadeur("actif"), true);
  for (const statut of ["en-attente", "refuse", "suspendu", null] as const) assert.equal(peutOuvrirEspaceAmbassadeur(statut), false);
});
