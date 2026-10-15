import assert from "node:assert/strict";
import { test } from "node:test";

import { villesFrance } from "@sos-miam/commun/contenus/villes-france";
import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

function trouverVilleFranceAvant(nom) {
  const cherche = normaliserRecherche(nom);
  if (cherche === "") return null;
  return villesFrance.find((v) => normaliserRecherche(v.valeur) === cherche) ?? villesFrance.find((v) => normaliserRecherche(v.nom) === cherche) ?? null;
}

const variantes = (nom) => [nom, nom.toUpperCase(), nom.toLowerCase(), nom.normalize("NFD").replace(/\p{Diacritic}/gu, ""), nom.replace(/-/g, " "), ` ${nom}  `];

test("même ville que la recherche d'avant, pour chaque nom, valeur et variante de la liste", () => {
  for (const ville of villesFrance) {
    for (const nom of [...variantes(ville.nom), ...variantes(ville.valeur)]) {
      assert.equal(trouverVilleFrance(nom), trouverVilleFranceAvant(nom), nom);
    }
  }
});

test("une ville absente de la liste, un nom vide : null", () => {
  for (const nom of ["", "   ", "Villeneuve-d'Ascq", "Monthieux", "Pétaouchnok", "-"]) {
    assert.equal(trouverVilleFrance(nom), trouverVilleFranceAvant(nom), nom);
  }
  assert.equal(trouverVilleFrance(""), null);
  assert.equal(trouverVilleFrance("Pétaouchnok"), null);
});

test("la ville rendue est celle de la liste (même objet), et le deuxième appel aussi", () => {
  const ville = villesFrance[0];
  assert.equal(trouverVilleFrance(ville.nom), ville);
  assert.equal(trouverVilleFrance(ville.nom), ville);
});

test("au-delà de 5 000 noms cherchés, les réponses restent justes", () => {
  for (let i = 0; i < 6_000; i++) assert.equal(trouverVilleFrance(`Inconnue ${i}`), null);
  for (const ville of villesFrance) assert.equal(trouverVilleFrance(ville.nom), trouverVilleFranceAvant(ville.nom));
});
