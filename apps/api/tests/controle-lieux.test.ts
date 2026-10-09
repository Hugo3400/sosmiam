// Tests du contrôle des fiches de lieux : ce qui manque, positions douteuses, doublons (sans base).
import assert from "node:assert/strict";
import { test } from "node:test";

import { listerManquesLieu, type FichePourManques } from "../src/fonctions/lieux/lister-manques-lieu.ts";
import { repererPositionsDouteuses } from "../src/fonctions/lieux/reperer-positions-douteuses.ts";
import { simplifierNomLieu } from "../src/fonctions/lieux/simplifier-nom-lieu.ts";
import { trouverDoublonsLieux } from "../src/fonctions/lieux/trouver-doublons-lieux.ts";

const complete: FichePourManques = {
  info: "Trattoria", texte: "Des pâtes fraîches faites chaque matin, une terrasse sous les platanes et une carte courte qui change chaque semaine.",
  adresse: "12 rue de l'Aiguillerie", quartier: "Écusson", ville: "Montpellier", latitude: 43.61, longitude: 3.88, horaires: "Mar-sam 12h-14h",
  ouverture: [{ jours: [2], de: "12:00", a: "14:00" }], plat: "Cacio e pepe", telephone: "04 67 00 00 00", siteWeb: null, instagram: null,
  animaux: null, accessible: null, terrasse: true, wifi: null, enfants: null, parking: null, paiements: [], reservation: null,
};

test("ce qui manque à une fiche : rien si complète, sinon chaque point dans l'ordre", () => {
  assert.deepEqual(listerManquesLieu(complete), []);
  const vide = { ...complete, info: "", texte: "Trop court", adresse: null, quartier: " ", latitude: null, ouverture: [], plat: "", telephone: null, terrasse: null };
  assert.deepEqual(listerManquesLieu(vide), ["categorie", "presentation", "adresse", "position", "quartier", "creneaux", "plat", "contact", "infos-pratiques"]);
  assert.deepEqual(listerManquesLieu({ ...complete, terrasse: null, paiements: ["cb"] }), [], "un moyen de paiement suffit comme info pratique");
});

test("positions douteuses : loin des autres lieux de sa ville, ou en (0, 0)", () => {
  const montpellier = (id: number, latitude: number, longitude: number) => ({ id, ville: "Montpellier", latitude, longitude });
  const douteux = repererPositionsDouteuses([
    montpellier(1, 43.611, 3.877), montpellier(2, 43.608, 3.879), montpellier(3, 43.605, 3.873), montpellier(4, 43.61, 3.88),
    montpellier(5, 43.3, 3.5), // en mer, à ~45 km
    { id: 6, ville: "montpellier ", latitude: 0, longitude: 0 },
    { id: 7, ville: "Sète", latitude: 43.4, longitude: 3.7 }, // seule à Sète : pas assez de lieux pour juger
    { id: 8, ville: "Montpellier", latitude: null, longitude: null },
  ]);
  assert.deepEqual(douteux.map((d) => d.id), [6, 5]);
  assert.ok(douteux[1]!.distanceKm! > 40);
});

test("doublons : même nom (sans « Restaurant », « Le »…) dans la même ville, même adresse, même nom tout près", () => {
  assert.equal(simplifierNomLieu("Restaurant Le 140"), "140");
  assert.equal(simplifierNomLieu("Le Bar"), "le bar", "un nom fait seulement de mots vides reste entier");
  const groupes = trouverDoublonsLieux([
    { id: 1, nom: "Restaurant le 140", ville: "La Grande-Motte", adresse: null, latitude: null, longitude: null },
    { id: 2, nom: "Le 140", ville: "la grande motte", adresse: null, latitude: null, longitude: null },
    { id: 3, nom: "Pepita Cafe", ville: "Montpellier", adresse: "3 rue Foch", latitude: null, longitude: null },
    { id: 4, nom: "La Cantine du 3", ville: "Montpellier", adresse: "3 Rue Foch", latitude: null, longitude: null },
    { id: 5, nom: "Kaleido", ville: "Montpellier", adresse: null, latitude: 43.611, longitude: 3.877 },
    { id: 6, nom: "Kaléido", ville: "Castelnau-le-Lez", adresse: null, latitude: 43.612, longitude: 3.878 },
    { id: 7, nom: "Kaleido", ville: "Lyon", adresse: null, latitude: 45.76, longitude: 4.83 },
  ]);
  assert.deepEqual(groupes, [
    { ids: [1, 2], raison: "meme-nom" },
    { ids: [3, 4], raison: "meme-adresse" },
    { ids: [5, 6], raison: "meme-nom-proche" },
  ]);
});
