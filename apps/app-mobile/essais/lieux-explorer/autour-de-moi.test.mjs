import assert from "node:assert/strict";
import { test } from "node:test";

import { villesFrance } from "@sos-miam/commun/contenus/villes-france";
import { direDeVille } from "~/fonctions/geo/dire-de-ville";
import { ecrireDepuisVille } from "~/fonctions/geo/ecrire-depuis-ville";
import { retrouverPorteeSansPosition } from "~/fonctions/lieux/retrouver-portee-sans-position";

test("« de » devant une ville, contracté comme on le dit : du Havre, des Abymes, d'Agde, de La Rochelle", () => {
  assert.equal(direDeVille("Le Havre", "fr"), "du Havre");
  assert.equal(direDeVille("Le Mans", "fr"), "du Mans");
  assert.equal(direDeVille("Les Abymes", "fr"), "des Abymes");
  assert.equal(direDeVille("Les Sables-d'Olonne", "fr"), "des Sables-d'Olonne");
  assert.equal(direDeVille("La Rochelle", "fr"), "de La Rochelle");
  assert.equal(direDeVille("Agde", "fr"), "d'Agde");
  assert.equal(direDeVille("Orléans", "fr"), "d'Orléans");
  assert.equal(direDeVille("Montpellier", "fr"), "de Montpellier");
  assert.equal(direDeVille("Lens", "fr"), "de Lens");
  assert.equal(direDeVille("Lesneven", "fr"), "de Lesneven");
  assert.equal(ecrireDepuisVille("le havre", "fr"), "du Havre");
  assert.equal(ecrireDepuisVille("Les Abymes", "fr"), "des Abymes");
  assert.equal(ecrireDepuisVille("Montpellier", "fr"), "de Montpellier");
  assert.equal(ecrireDepuisVille("Trifouilly-les-Oies", "fr"), null);
  for (const ville of villesFrance) assert.doesNotMatch(direDeVille(ville.nom, "fr"), /^de (Le|Les) /, ville.nom);
});

test("Autour de moi éteint : la portée d'avant revient, et sans point de départ on retourne sur toute la France", () => {
  assert.equal(retrouverPorteeSansPosition("proche", { portee: null }, false), null);
  assert.equal(retrouverPorteeSansPosition("proche", { portee: "region" }, false), "region");
  assert.equal(retrouverPorteeSansPosition("proche", { portee: "proche" }, false), "proche");
  assert.equal(retrouverPorteeSansPosition("proche", { portee: "proche" }, true), null);
  assert.equal(retrouverPorteeSansPosition("proche", null, true), null);
  assert.equal(retrouverPorteeSansPosition("proche", null, false), "proche");
  assert.equal(retrouverPorteeSansPosition("france", null, true), "france");
  assert.equal(retrouverPorteeSansPosition("region", null, false), "region");
  assert.equal(retrouverPorteeSansPosition(null, null, true), null);
  assert.equal(retrouverPorteeSansPosition("region", { portee: "france" }, true), "region");
});
