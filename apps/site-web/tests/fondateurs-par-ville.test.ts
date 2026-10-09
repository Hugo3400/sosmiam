// Fondateurs par ville : les textes tirés des zones de l'API et la lecture des codes et des jetons collés.
// node --test tests/*.test.ts (dans apps/site-web).
import assert from "node:assert/strict";
import { test } from "node:test";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { ecrireNomAvecArticle } from "../src/fonctions/fondateurs/ecrire-nom-avec-article.ts";
// @ts-ignore : même raison
import { ecrireNumeroFondateur } from "../src/fonctions/fondateurs/ecrire-numero-fondateur.ts";
// @ts-ignore : même raison
import { lireCodeCommune } from "../src/fonctions/fondateurs/lire-code-commune.ts";
// @ts-ignore : même raison
import { extraireJeton } from "../src/fonctions/texte/extraire-jeton.ts";

const sansInsecables = (texte: string) => texte.replace(/ /g, " ");

test("le nom de la zone avec son article, tiré de « nomAvecDe »", () => {
  const attendus: [string, string, string][] = [
    ["du Rhône", "Rhône", "le Rhône"], ["des Landes", "Landes", "les Landes"], ["de la Creuse", "Creuse", "la Creuse"],
    ["de l'Ain", "Ain", "l'Ain"], ["d'Indre-et-Loire", "Indre-et-Loire", "Indre-et-Loire"], ["de Paris", "Paris", "Paris"],
    ["de Polynésie française", "Polynésie française", "Polynésie française"], ["", "Rhône", "Rhône"],
  ];
  for (const [nomAvecDe, nom, texte] of attendus) assert.equal(ecrireNomAvecArticle(nomAvecDe, nom), texte, nomAvecDe);
});

test("le titre de la carte : « Fondateur n° 3 de Lyon · n° 147 en France »", () => {
  const zone = { code: "69123", type: "ville" as const, nom: "Lyon", nomAvecDe: "de Lyon", places: 10, prises: 3, libres: 7 };
  assert.equal(sansInsecables(ecrireNumeroFondateur({ numeroLocal: 3, numeroNational: 147, zone })), "Fondateur n° 3 de Lyon · n° 147 en France");
  assert.equal(sansInsecables(ecrireNumeroFondateur({ numeroLocal: 1, numeroNational: 2, zone: { ...zone, nomAvecDe: "de La Rochelle" } }, "Fondatrice")),
    "Fondatrice n° 1 de La Rochelle · n° 2 en France");
  assert.equal(sansInsecables(ecrireNumeroFondateur({ numeroLocal: 4, numeroNational: null, zone: null })), "Fondateur n° 4");
});

test("codes de commune et jetons collés", () => {
  assert.equal(lireCodeCommune(" 69123 "), "69123");
  assert.equal(lireCodeCommune("2a004"), "2A004");
  for (const mauvais of ["6912", "691234", "lyon", null, 69123]) assert.equal(lireCodeCommune(mauvais), null, String(mauvais));
  const jeton = "AbC_def-0123456789xyz";
  assert.equal(extraireJeton(jeton), jeton);
  assert.equal(extraireJeton(` https://ambassadeur.sosmiam.fr/verifier-email#jeton=${jeton} `), jeton);
  assert.equal(extraireJeton("trop-court"), null);
  assert.equal(extraireJeton("jeton=avec des espaces dedans"), null);
});
