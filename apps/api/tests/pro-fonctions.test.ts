// Tests des fonctions pures de l'espace pro : le SIRET (clé de Luhn, exception de La Poste) et la préparation d'un PATCH
// de fiche (champs directs, effacement, nom et adresse mis à part pour l'équipe, champs inchangés retirés).
import assert from "node:assert/strict";
import { test } from "node:test";

import { chargerValiderPropositionLieu } from "../src/fonctions/commun/charger-valider-proposition-lieu.ts";
import { preparerModificationFiche } from "../src/fonctions/pro/preparer-modification-fiche.ts";
import { verifierSiret } from "../src/fonctions/pro/verifier-siret.ts";
import { FICHE_TEST } from "./outils/creer-banc-pro.ts";

test("verifierSiret : 14 chiffres et clé de Luhn juste", () => {
  assert.equal(verifierSiret("73282932000074"), true);
  assert.equal(verifierSiret("44306184100047"), true);
  assert.equal(verifierSiret("73282932000075"), false, "un chiffre de travers");
  assert.equal(verifierSiret("12345678900000"), false);
  for (const faux of ["", "7328293200007", "732829320000740", "7328293200007A", "732 829 320 00074"]) assert.equal(verifierSiret(faux), false, faux);
});

test("verifierSiret : La Poste (SIREN 356 000 000) a sa propre règle, sauf son siège", () => {
  assert.equal(verifierSiret("35600000049837"), true, "somme des chiffres multiple de 5");
  assert.equal(verifierSiret("35600000012345"), false);
  assert.equal(verifierSiret("35600000000048"), true, "le siège suit la clé de Luhn");
});

const valider = await chargerValiderPropositionLieu();
const preparer = (corps: Record<string, unknown>) => preparerModificationFiche(corps, FICHE_TEST, valider);

test("preparerModificationFiche : champs directs vérifiés, normalisés, et seulement ceux qui changent", () => {
  const resultat = preparer({ horaires: " Tous les jours, 12h–23h ", telephone: "+33 4 65 71 00 01", wifi: false, paiements: ["especes", "cb", "tickets-resto"] });
  assert.deepEqual(resultat, { ok: true, directs: { horaires: "Tous les jours, 12h–23h", wifi: false, paiements: ["cb", "especes", "tickets-resto"] }, parEquipe: {}, message: null });
});

test("preparerModificationFiche : null, \"\" ou [] efface l'info (texte vide pour horaires et texte)", () => {
  const resultat = preparer({ telephone: "", siteWeb: null, accessible: null, paiements: [], horaires: "  ", texte: null, instagram: null });
  assert.deepEqual(resultat, {
    ok: true, directs: { telephone: null, siteWeb: null, accessible: null, paiements: [], horaires: "", texte: "" }, parEquipe: {}, message: null,
  }, "instagram était déjà inconnu : rien à effacer");
});

test("preparerModificationFiche : nom et adresse mis à part pour l'équipe, avec le « Pourquoi ? »", () => {
  const resultat = preparer({ nom: "Chez Léa et Max", adresse: "3 rue de la Loge", texte: "Pâtes fraîches et tiramisu.", message: "On s'est associés !" });
  assert.deepEqual(resultat, { ok: true, directs: { texte: "Pâtes fraîches et tiramisu." }, parEquipe: { nom: "Chez Léa et Max" }, message: "On s'est associés !" });
});

test("preparerModificationFiche : refus avec le champ fautif", () => {
  const essais: [Record<string, unknown>, string][] = [
    [{}, "vide"],
    [{ message: "rien d'autre" }, "vide"],
    [{ prix: "€€€" }, "autre"],
    [{ statut: "publie" }, "autre"],
    [{ note: "coucou" }, "autre"],
    [{ nom: "" }, "nom"],
    [{ nom: null }, "nom"],
    [{ adresse: null }, "adresse"],
    [{ telephone: "12" }, "telephone"],
    [{ siteWeb: "http://chezlea.example.com" }, "siteWeb"],
    [{ animaux: "chats" }, "autre"],
    [{ wifi: "oui" }, "autre"],
    [{ horaires: "x".repeat(161) }, "horaires"],
    [{ nom: "Chez Max", message: 12 }, "message"],
  ];
  for (const [corps, champ] of essais) assert.deepEqual(preparer(corps), { ok: false, champ }, JSON.stringify(corps));
});

test("preparerModificationFiche : rien qui change → deux listes vides (pas une erreur)", () => {
  assert.deepEqual(preparer({ nom: "Chez Léa", telephone: "0465710001", accessible: true }), { ok: true, directs: {}, parEquipe: {}, message: null });
});
