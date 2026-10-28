import assert from "node:assert/strict";
import { test } from "node:test";

import { villesFrance } from "@sos-miam/commun/contenus/villes-france";
import { direDeVille } from "~/fonctions/geo/dire-de-ville";
import { decrireZoneRegardee } from "~/fonctions/geo/decrire-zone-regardee";
import { ecrireDepuisVille } from "~/fonctions/geo/ecrire-depuis-ville";
import { ecrireDistanceDepuis } from "~/fonctions/geo/ecrire-distance-depuis";
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

test("en anglais, le point de départ est le nom seul, et chaque phrase met sa préposition", () => {
  assert.equal(direDeVille("Le Havre", "en"), "Le Havre");
  assert.equal(ecrireDepuisVille("le havre", "en"), "Le Havre");
  assert.equal(ecrireDepuisVille("Trifouilly-les-Oies", "en"), null);
  assert.equal(ecrireDistanceDepuis(1.24, "de toi", "fr"), "1,2 km de toi");
  assert.equal(ecrireDistanceDepuis(1.24, "you", "en"), "1.2 km from you");
  assert.equal(ecrireDistanceDepuis(0.35, null, "en"), "350 m");
  assert.equal(decrireZoneRegardee({ portee: "proche", centre: null, rayonKm: 5 }, null, "de Montpellier", "fr"), "à moins de 5 km de Montpellier");
  assert.equal(decrireZoneRegardee({ portee: "proche", centre: null, rayonKm: 5 }, null, "Montpellier", "en"), "within 5 km of Montpellier");
  assert.equal(decrireZoneRegardee({ portee: "region", region: "Grand Est" }, "Grand Est", "de toi", "fr"), "dans le Grand Est");
  assert.equal(decrireZoneRegardee({ portee: "region", region: "Occitanie" }, "Occitanie", "de toi", "fr"), "en Occitanie");
  assert.equal(decrireZoneRegardee({ portee: "region", region: "Occitanie" }, "Occitanie", "you", "en"), "in Occitanie");
  assert.equal(decrireZoneRegardee({ portee: "france" }, null, "you", "en"), "all over France");
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
