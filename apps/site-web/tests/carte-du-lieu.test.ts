// Tests de l'éditeur de « Ma carte » (espace pro) : lecture du formulaire indexé, gestes (ajouter, supprimer, monter,
// descendre) recalculés côté serveur, conversion en carte vérifiée par la fonction commune (toutes les erreurs d'un coup),
// prix tapés à la française et date en lettres. node --test tests/*.test.ts (dans apps/site-web).
import assert from "node:assert/strict";
import { test } from "node:test";

import { LIMITES_CARTE } from "../../../packages/commun/src/regles/carte-du-lieu.ts";
import { appliquerGesteCarte } from "../src/fonctions/carte/appliquer-geste-carte.ts";
import { convertirBrouillonEnCarte } from "../src/fonctions/carte/convertir-brouillon-en-carte.ts";
import { creerBrouillonCarte, PLAT_VIDE } from "../src/fonctions/carte/creer-brouillon-carte.ts";
import { ecrireValeursBrouillon } from "../src/fonctions/carte/ecrire-valeurs-brouillon.ts";
import { lireBrouillonCarte } from "../src/fonctions/carte/lire-brouillon-carte.ts";
import { lirePrixSaisi } from "../src/fonctions/carte/lire-prix-saisi.ts";
import { formaterJourEnLettres } from "../src/fonctions/dates/formater-jour-en-lettres.ts";

const plat = (nom: string, prix = "10", autres: Partial<typeof PLAT_VIDE> = {}) => ({ ...PLAT_VIDE, etiquettes: [], nom, prix, ...autres });
const BROUILLON = {
  sections: [
    { titre: "Plats", elements: [plat("Pâtes"), plat("Gratin"), plat("Salade")] },
    { titre: "À boire", elements: [plat("Spritz", "7", { alcool: true, unite: "le verre" })] },
  ],
};

test("lirePrixSaisi : virgule, point, espaces et €", () => {
  for (const [texte, prix] of [["12", 12], ["12,50", 12.5], ["4.5", 4.5], [" 1 200 ", 1200], ["4,50 €", 4.5], ["0", 0], ["-3", -3], ["4,505", 4.505]] as const) {
    assert.equal(lirePrixSaisi(texte), prix, texte);
  }
  for (const texte of ["", "douze", "12,5,0", "1e3", "€"]) assert.equal(lirePrixSaisi(texte), null, texte);
});

test("lireBrouillonCarte : champs indexés dans l'ordre des numéros, cases à vrai, repères en liste", () => {
  const formulaire = new FormData();
  formulaire.append("geste", "enregistrer");
  formulaire.append("sections[1][titre]", "À boire");
  formulaire.append("sections[1][elements][0][nom]", "Spritz");
  formulaire.append("sections[1][elements][0][alcool]", "oui");
  formulaire.append("sections[0][titre]", "Plats");
  formulaire.append("sections[0][elements][2][nom]", "Salade");
  formulaire.append("sections[0][elements][0][nom]", "Pâtes");
  formulaire.append("sections[0][elements][0][prix]", "12,50");
  formulaire.append("sections[0][elements][0][etiquettes]", "vege");
  formulaire.append("sections[0][elements][0][etiquettes]", "fait-maison");
  formulaire.append("sections[0][elements][0][signature]", "oui");
  formulaire.append("sections[0][elements][0][inconnu]", "x");
  assert.deepEqual(lireBrouillonCarte(formulaire), {
    sections: [
      { titre: "Plats", elements: [plat("Pâtes", "12,50", { signature: true, etiquettes: ["vege", "fait-maison"] }), plat("Salade", "")] },
      { titre: "À boire", elements: [plat("Spritz", "", { alcool: true })] },
    ],
  });
});

test("lireBrouillonCarte : jamais plus que LIMITES_CARTE", () => {
  const formulaire = new FormData();
  for (let i = 0; i < LIMITES_CARTE.sections + 3; i++) formulaire.append(`sections[${i}][titre]`, `S${i}`);
  for (let j = 0; j < LIMITES_CARTE.elementsParSection + 5; j++) formulaire.append(`sections[0][elements][${j}][nom]`, `P${j}`);
  const brouillon = lireBrouillonCarte(formulaire);
  assert.equal(brouillon.sections.length, LIMITES_CARTE.sections);
  assert.equal(brouillon.sections[0]?.elements.length, LIMITES_CARTE.elementsParSection);
});

test("appliquerGesteCarte : ajouter une section (avec un plat) et un plat, focus sur le nouveau champ", () => {
  const section = appliquerGesteCarte(BROUILLON, "ajouter-section");
  assert.equal(section.brouillon.sections.length, 3);
  assert.deepEqual(section.brouillon.sections[2], { titre: "", elements: [plat("", "")] });
  assert.deepEqual(section.focus, { champ: "sections[2][titre]" });
  const ajout = appliquerGesteCarte(BROUILLON, "ajouter-plat:1");
  assert.equal(ajout.brouillon.sections[1]?.elements.length, 2);
  assert.deepEqual(ajout.focus, { champ: "sections[1][elements][1][nom]" });
  assert.equal(BROUILLON.sections[1]?.elements.length, 1, "le brouillon de départ ne bouge pas");
});

test("appliquerGesteCarte : monter, descendre, supprimer ; le focus suit le bouton", () => {
  const monte = appliquerGesteCarte(BROUILLON, "monter-plat:0:2");
  assert.deepEqual(monte.brouillon.sections[0]?.elements.map((e) => e.nom), ["Pâtes", "Salade", "Gratin"]);
  assert.deepEqual(monte.focus, { bouton: "carte-monter-plat-0-1" });
  const enHaut = appliquerGesteCarte(BROUILLON, "monter-plat:0:1");
  assert.deepEqual(enHaut.focus, { bouton: "carte-descendre-plat-0-0" }, "tout en haut : plus de « Monter »");
  const descendue = appliquerGesteCarte(BROUILLON, "descendre-section:0");
  assert.deepEqual(descendue.brouillon.sections.map((s) => s.titre), ["À boire", "Plats"]);
  assert.deepEqual(descendue.focus, { bouton: "carte-monter-section-1" });
  const retire = appliquerGesteCarte(BROUILLON, "supprimer-plat:0:2");
  assert.deepEqual(retire.brouillon.sections[0]?.elements.map((e) => e.nom), ["Pâtes", "Gratin"]);
  assert.deepEqual(retire.focus, { champ: "sections[0][elements][1][nom]" });
  const dernier = appliquerGesteCarte(BROUILLON, "supprimer-plat:1:0");
  assert.deepEqual([dernier.brouillon.sections[1]?.elements, dernier.focus], [[], { bouton: "carte-ajouter-plat-1" }]);
  const sansSection = appliquerGesteCarte({ sections: [{ titre: "Seule", elements: [] }] }, "supprimer-section:0");
  assert.deepEqual([sansSection.brouillon.sections, sansSection.focus], [[], { bouton: "carte-ajouter-section" }]);
});

test("appliquerGesteCarte : gestes inconnus, hors limites ou au bord : rien ne change", () => {
  for (const geste of ["", "effacer-tout", "monter-plat:0:0", "descendre-plat:0:2", "supprimer-plat:5:0", "monter-section:0", "ajouter-plat:9", "ajouter-plat:1:2:3"]) {
    const resultat = appliquerGesteCarte(BROUILLON, geste);
    assert.equal(resultat.fait, false, geste);
    assert.deepEqual(resultat.brouillon, BROUILLON, geste);
  }
  const pleine = { sections: [{ titre: "P", elements: Array.from({ length: LIMITES_CARTE.elementsParSection }, () => plat("x")) }] };
  assert.equal(appliquerGesteCarte(pleine, "ajouter-plat:0").fait, false);
  const vingt = { sections: Array.from({ length: LIMITES_CARTE.sections }, () => ({ titre: "S", elements: [] })) };
  assert.equal(appliquerGesteCarte(vingt, "ajouter-section").fait, false);
});

test("convertirBrouillonEnCarte : la carte propre, prix en nombres ; vide → null", () => {
  assert.deepEqual(convertirBrouillonEnCarte({ sections: [] }), { ok: true, carte: null });
  const resultat = convertirBrouillonEnCarte({
    sections: [{ titre: " Plats ", elements: [plat("Pâtes", "12,50", { signature: true, etiquettes: ["fait-maison", "vege"], description: " Fraîches " })] }, { titre: "Bientôt", elements: [] }],
  });
  assert.deepEqual(resultat, {
    ok: true,
    carte: { sections: [{ titre: "Plats", elements: [{ nom: "Pâtes", description: "Fraîches", prix: 12.5, signature: true, etiquettes: ["vege", "fait-maison"] }] }, { titre: "Bientôt", elements: [] }] },
  });
});

test("convertirBrouillonEnCarte : TOUTES les erreurs, dans l'ordre du formulaire", () => {
  const resultat = convertirBrouillonEnCarte({
    sections: [
      { titre: "", elements: [plat("", "-2"), plat("Gratin", "")] },
      { titre: "Desserts", elements: [plat("Tarte", "4,505", { unite: "u".repeat(LIMITES_CARTE.unite + 1) }), plat("Glace", "douze")] },
    ],
  });
  assert.equal(resultat.ok, false);
  if (resultat.ok) return;
  assert.deepEqual(Object.keys(resultat.erreurs), [
    "sections[0][titre]", "sections[0][elements][0][nom]", "sections[0][elements][0][prix]", "sections[0][elements][1][prix]",
    "sections[1][elements][0][prix]", "sections[1][elements][0][unite]", "sections[1][elements][1][prix]",
  ]);
  assert.match(resultat.erreurs["sections[0][elements][1][prix]"] ?? "", /Indique un prix/);
  assert.match(resultat.erreurs["sections[1][elements][1][prix]"] ?? "", /entre 0 et/);
});

test("creerBrouillonCarte et ecrireValeursBrouillon : prix à la française, cases et repères", () => {
  const brouillon = creerBrouillonCarte({ sections: [{ titre: "Plats", elements: [{ nom: "Pâtes", prix: 12.5, alcool: true, etiquettes: ["vege", "local"] }, { nom: "Pain", prix: 2 }] }], majLe: "2026-10-09" });
  assert.deepEqual(brouillon.sections[0]?.elements.map((e) => e.prix), ["12,50", "2"]);
  assert.deepEqual(creerBrouillonCarte(null), { sections: [] });
  const valeurs = ecrireValeursBrouillon(brouillon);
  assert.equal(valeurs["sections[0][titre]"], "Plats");
  assert.equal(valeurs["sections[0][elements][0][alcool]"], "oui");
  assert.equal(valeurs["sections[0][elements][0][signature]"], undefined);
  assert.equal(valeurs["sections[0][elements][0][etiquettes]"], "vege,local");
  // Aller-retour : le brouillon d'une carte propre redonne la même carte
  assert.deepEqual(convertirBrouillonEnCarte(brouillon), { ok: true, carte: { sections: [{ titre: "Plats", elements: [{ nom: "Pâtes", prix: 12.5, alcool: true, etiquettes: ["vege", "local"] }, { nom: "Pain", prix: 2 }] }] } });
});

test("formaterJourEnLettres : « 9 octobre 2026 », « 1er » ; illisible → null", () => {
  assert.equal(formaterJourEnLettres("2026-10-09"), "9 octobre 2026");
  assert.equal(formaterJourEnLettres("2026-11-01"), "1er novembre 2026");
  for (const faux of ["", "2026-13-01", "9 octobre"]) assert.equal(formaterJourEnLettres(faux), null, faux);
});
