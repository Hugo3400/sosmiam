// Tests des outils du quotidien : calendrier, réponses types, bilan du mois, pastilles du menu, recherche.
import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerPastilles } from "../src/fonctions/alertes/calculer-pastilles.ts";
import { creerHtmlBilan } from "../src/fonctions/bilan/creer-html-bilan.ts";
import { construireGrilleMois } from "../src/fonctions/dates/construire-grille-mois.ts";
import { listerResultatsRecherche } from "../src/fonctions/recherche/lister-resultats-recherche.ts";
import { remplirReponseType } from "../src/fonctions/texte/remplir-reponse-type.ts";

test("calendrier : octobre 2026 commence un jeudi, semaines du lundi au dimanche", () => {
  const grille = construireGrilleMois(2026, 9);
  assert.deepEqual(grille[0], ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
  assert.equal(grille.at(-1)!.at(-1), "2026-11-01");
  assert.equal(grille.length, 5);
});

test("réponses types : prénom et lieu remplis, ce qui manque reste visible", () => {
  assert.equal(remplirReponseType("Salut {prenom}, merci pour {lieu} !", { prenom: "Léa", lieu: "Chez Lia" }), "Salut Léa, merci pour Chez Lia !");
  assert.equal(remplirReponseType("Salut {prenom} !", {}), "Salut [prénom] !");
});

test("bilan du mois : chiffres, évolution, et texte saisi échappé", () => {
  const vide = { visiteurs: 0, visites: 0, vues: 0, inscrits: 0, comptes: 0, ambassadeurs: 0, lieux: 0, publications: 0, demandes: 0, missions: 0, signalements: 0, mails: 0, notifications: 0, bigSos: [] };
  const html = creerHtmlBilan({
    actuel: { ...vide, mois: "2026-10", visiteurs: 1200, bigSos: [{ debutLe: "2026-10-12T08:00:00Z", objectifTitre: "Visites", objectifCible: 300, objectifAtteint: 210, bilan: "<b>Merci</b>", lieu: { nom: "Chez <Lia>", ville: "Lyon" } }] },
    precedent: { ...vide, mois: "2026-09", visiteurs: 1000 },
    totaux: { lieuxEnLigne: 12, inscrits: 340, ambassadeursActifs: 8, comptes: 40 },
  });
  assert.ok(html.includes("octobre 2026") && html.includes("1 200") && html.includes("+20 %"));
  assert.ok(html.includes("Chez &lt;Lia&gt;") && html.includes("&lt;b&gt;Merci") && !html.includes("<b>Merci"));
});

test("pastilles du menu : urgence en rouge, contestations comptées avec la modération", () => {
  const pastilles = calculerPastilles(
    { moderation: { aTraiter: 2, urgents: 1, contestes: 1 }, demandes: { aTraiter: 3 }, ambassadeurs: { enAttente: 1, candidatures: 2 }, missionsFaites: 9, bigSos: { aTraiter: 1, aCloturer: 1, demarrentBientot: [] } },
    0,
  );
  assert.deepEqual([pastilles.moderation?.nombre, pastilles.moderation?.urgent], [3, true]);
  assert.equal(pastilles.ambassadeurs?.nombre, 3);
  assert.equal(pastilles["big-sos"]?.nombre, 2);
  assert.equal(calculerPastilles(null, 2).maintenance?.nombre, 2);
});

test("recherche : les écrans d'abord (sans accents), puis les données", () => {
  const resultats = listerResultatsRecherche("stat", { lieux: [{ id: 3, nom: "Statique", emoji: "🍝", ville: "Lyon", statut: "publie" }], comptes: [], publications: [], bigSos: [], demandes: [], inscrits: [] });
  assert.equal(resultats[0]?.titre, "Statistiques");
  assert.deepEqual([resultats.at(-1)?.ecran, resultats.at(-1)?.id], ["lieux", 3]);
  assert.ok(listerResultatsRecherche("reglages", null).some((r) => r.titre === "Réglages"));
});
