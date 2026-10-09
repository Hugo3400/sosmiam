// Tests des filtres de la liste des lieux : type, catégorie (« Ce que c'est ») et comptage des catégories.
import assert from "node:assert/strict";
import { test } from "node:test";

import { compterValeursLieux } from "../src/fonctions/lieux/compter-valeurs-lieux.ts";
import { filtrerLieux } from "../src/fonctions/lieux/filtrer-lieux.ts";
import type { ResumeLieu } from "../src/services/lieux.ts";

const lieux: (Pick<ResumeLieu, "type" | "info" | "ville"> & { id: number })[] = [
  { id: 1, type: "resto", info: "Bar à tapas", ville: "Montpellier" },
  { id: 2, type: "resto", info: "Brasserie", ville: "Saint-Jean-de-Védas" },
  { id: 3, type: "resto", info: "bar a tapas ", ville: "montpellier" },
  { id: 4, type: "bar", info: "Bar à cocktail", ville: "Sète" },
  { id: 5, type: "resto", info: "", ville: "" },
  { id: 6, type: "resto", info: "Brasserie", ville: "Montpellier" },
  { id: 7, type: "resto", info: "Bar à tapas", ville: "Lattes" },
];

test("filtre par type et par catégorie, sans tenir compte des majuscules, accents ni espaces", () => {
  assert.deepEqual(filtrerLieux(lieux, { type: "bar", categorie: "", ville: "" }).map((l) => l.id), [4]);
  assert.deepEqual(filtrerLieux(lieux, { type: "", categorie: "Bar à tapas", ville: "" }).map((l) => l.id), [1, 3, 7]);
  assert.deepEqual(filtrerLieux(lieux, { type: "bar", categorie: "Bar à tapas", ville: "" }).map((l) => l.id), []);
  assert.equal(filtrerLieux(lieux, { type: "", categorie: "", ville: "" }).length, lieux.length);
  assert.deepEqual(filtrerLieux(lieux, { type: "", categorie: "", ville: "Montpellier" }).map((l) => l.id), [1, 3, 6]);
  assert.deepEqual(filtrerLieux(lieux, { type: "", categorie: "", ville: "saint jean de vedas" }).map((l) => l.id), [2]);
  assert.deepEqual(filtrerLieux(lieux, { type: "resto", categorie: "Bar à tapas", ville: "Montpellier" }).map((l) => l.id), [1, 3]);
});

test("catégories et villes comptées : les plus fréquentes d'abord, écritures voisines ensemble, sans les vides", () => {
  assert.deepEqual(compterValeursLieux(lieux, "ville"), [
    { libelle: "Montpellier", nombre: 3 },
    { libelle: "Lattes", nombre: 1 },
    { libelle: "Saint-Jean-de-Védas", nombre: 1 },
    { libelle: "Sète", nombre: 1 },
  ]);
  // La valeur choisie reste dans la liste, même sans lieu
  assert.deepEqual(compterValeursLieux([], "ville", "Sète"), [{ libelle: "Sète", nombre: 0 }]);
  assert.deepEqual(compterValeursLieux(lieux, "info"), [
    { libelle: "Bar à tapas", nombre: 3 },
    { libelle: "Brasserie", nombre: 2 },
    { libelle: "Bar à cocktail", nombre: 1 },
  ]);
});

test("valeurs d'une fiche lisibles : vide, Oui/Non, type, infos pratiques, listes, créneaux du lundi au dimanche", async () => {
  const { formaterValeurLieu } = await import("../src/fonctions/lieux/formater-valeur-lieu.ts");
  assert.equal(formaterValeurLieu("telephone", null), "—");
  assert.equal(formaterValeurLieu("tags", []), "—");
  assert.equal(formaterValeurLieu("wifi", true), "Oui");
  assert.equal(formaterValeurLieu("parking", false), "Non");
  assert.equal(formaterValeurLieu("type", "patisserie"), "Pâtisserie");
  assert.equal(formaterValeurLieu("animaux", "terrasse"), "En terrasse seulement");
  assert.equal(formaterValeurLieu("paiements", ["cb", "tickets-resto"]), "CB, Tickets resto");
  assert.equal(formaterValeurLieu("ouverture", [{ jours: [0, 2, 1], de: "12:00", a: "14:00" }]), "lun, mar, dim · 12:00–14:00");
  assert.equal(formaterValeurLieu("prixMoyen", 18), "18");
});

test("réponse à l'auteur d'une modification : tout, une partie (champs nommés), ou rien (avec des crochets)", async () => {
  const { redigerReponseSuggestion } = await import("../src/fonctions/lieux/rediger-reponse-suggestion.ts");
  const tout = redigerReponseSuggestion({ prenom: "Léa", lieu: "La Fournée", champsAppliques: ["Horaires", "Wifi"], total: 2 });
  assert.ok(tout.startsWith("Salut Léa !") && tout.includes("c'est à jour") && !tout.includes("["));
  const partie = redigerReponseSuggestion({ prenom: null, lieu: "La Fournée", champsAppliques: ["Horaires"], total: 3 });
  assert.ok(partie.startsWith("Salut !") && partie.includes("On a mis à jour : horaires."));
  const rien = redigerReponseSuggestion({ prenom: "Léa", lieu: "La Fournée", champsAppliques: [], total: 2 });
  assert.ok(rien.includes("on garde la fiche telle quelle") && rien.includes("[dis pourquoi"));
});

test("filtre de qualité : fiches à compléter ou complètes", () => {
  const fiches = [{ id: 1, type: "resto", info: "x", ville: "Sète", manques: [] }, { id: 2, type: "resto", info: "x", ville: "Sète", manques: ["position"] }] as (Pick<ResumeLieu, "type" | "info" | "ville"> & { id: number; manques: string[] })[];
  assert.deepEqual(filtrerLieux(fiches, { type: "", categorie: "", ville: "", qualite: "complete" }).map((l) => l.id), [1]);
  assert.deepEqual(filtrerLieux(fiches, { type: "", categorie: "", ville: "", qualite: "a-completer" }).map((l) => l.id), [2]);
});
