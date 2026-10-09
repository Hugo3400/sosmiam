import { test } from "node:test";
import assert from "node:assert/strict";
import { LIMITES_CARTE } from "../src/regles/carte-du-lieu.ts";
import { validerCarteDuLieu } from "../src/validation/valider-carte-du-lieu.ts";
import { validerElementCarte } from "../src/validation/valider-element-carte.ts";

const element = (autres: Record<string, unknown> = {}) => ({ nom: "Moules du Capitaine", prix: 14, ...autres });

test("validerElementCarte : élément nettoyé (espaces, vides, faux, repères rangés)", () => {
  const r = validerElementCarte({
    nom: "  Spritz maison ",
    description: "  ",
    prix: 7.5,
    unite: " le verre ",
    signature: false,
    alcool: true,
    etiquettes: ["local", "vege", "local"],
    pirate: "<script>",
  });
  assert.deepEqual(r, { ok: true, element: { nom: "Spritz maison", prix: 7.5, unite: "le verre", alcool: true, etiquettes: ["vege", "local"] } });
  assert.deepEqual(validerElementCarte(element({ etiquettes: [] })), { ok: true, element: { nom: "Moules du Capitaine", prix: 14 } });
  assert.deepEqual(validerElementCarte(element({ description: null, unite: null, etiquettes: null })), { ok: true, element: { nom: "Moules du Capitaine", prix: 14 } });
});

test("validerElementCarte : prix au centime près, de 0 à 9 999 €", () => {
  assert.equal(validerElementCarte(element({ prix: 0 })).ok, true);
  assert.equal(validerElementCarte(element({ prix: 4.05 })).ok, true);
  assert.equal(validerElementCarte(element({ prix: 0.1 + 0.2 })).ok, true);
  assert.equal(validerElementCarte(element({ prix: LIMITES_CARTE.prixMax })).ok, true);
  for (const prix of [-1, 4.505, 10000, Number.NaN, Number.POSITIVE_INFINITY, "12", null, undefined]) {
    assert.deepEqual(validerElementCarte(element({ prix })), { ok: false, erreur: "carte-invalide", champ: "prix" }, String(prix));
  }
  const r = validerElementCarte(element({ prix: 0.1 + 0.2 }));
  assert.ok(r.ok && r.element.prix === 0.3);
});

test("validerElementCarte : textes vides, trop longs ou grossiers refusés", () => {
  assert.deepEqual(validerElementCarte(element({ nom: "   " })), { ok: false, erreur: "carte-invalide", champ: "nom" });
  assert.deepEqual(validerElementCarte(element({ nom: 12 })), { ok: false, erreur: "carte-invalide", champ: "nom" });
  assert.deepEqual(validerElementCarte(element({ nom: "x".repeat(LIMITES_CARTE.nom + 1) })), { ok: false, erreur: "carte-invalide", champ: "nom" });
  assert.equal(validerElementCarte(element({ nom: "x".repeat(LIMITES_CARTE.nom) })).ok, true);
  assert.deepEqual(validerElementCarte(element({ nom: "Burger du connard" })), { ok: false, erreur: "carte-invalide", champ: "nom" });
  assert.deepEqual(validerElementCarte(element({ description: "d".repeat(LIMITES_CARTE.description + 1) })), { ok: false, erreur: "carte-invalide", champ: "description" });
  assert.deepEqual(validerElementCarte(element({ description: 3 })), { ok: false, erreur: "carte-invalide", champ: "description" });
  assert.deepEqual(validerElementCarte(element({ unite: "u".repeat(LIMITES_CARTE.unite + 1) })), { ok: false, erreur: "carte-invalide", champ: "unite" });
  assert.deepEqual(validerElementCarte(element({ etiquettes: ["halal"] })), { ok: false, erreur: "carte-invalide", champ: "etiquettes" });
  assert.deepEqual(validerElementCarte(element({ etiquettes: "vege" })), { ok: false, erreur: "carte-invalide", champ: "etiquettes" });
  assert.deepEqual(validerElementCarte(element({ alcool: "oui" })), { ok: false, erreur: "carte-invalide", champ: "autre" });
  assert.deepEqual(validerElementCarte(element({ signature: 1 })), { ok: false, erreur: "carte-invalide", champ: "autre" });
  assert.deepEqual(validerElementCarte(["Moules"]), { ok: false, erreur: "carte-invalide", champ: "autre" });
});

test("validerCarteDuLieu : carte nettoyée, section vide permise, date jamais reprise", () => {
  const r = validerCarteDuLieu({
    majLe: "2020-01-01",
    sections: [
      { titre: " Les plats ", elements: [element({ description: " Moules de Bouzigues " })] },
      { titre: "Desserts", elements: [] },
    ],
  });
  assert.deepEqual(r, {
    ok: true,
    carte: {
      sections: [
        { titre: "Les plats", elements: [{ nom: "Moules du Capitaine", description: "Moules de Bouzigues", prix: 14 }] },
        { titre: "Desserts", elements: [] },
      ],
    },
  });
  assert.deepEqual(validerCarteDuLieu({ sections: [] }), { ok: true, carte: { sections: [] } });
});

test("validerCarteDuLieu : dit où corriger", () => {
  const carte = { sections: [{ titre: "Plats", elements: [element(), element({ prix: -2 })] }] };
  assert.deepEqual(validerCarteDuLieu(carte), { ok: false, erreur: "carte-invalide", champ: "prix", section: 0, element: 1 });
  assert.deepEqual(validerCarteDuLieu({ sections: [{ titre: "Plats", elements: [] }, { titre: " ", elements: [] }] }), {
    ok: false,
    erreur: "carte-invalide",
    champ: "titre",
    section: 1,
    element: null,
  });
  assert.equal(validerCarteDuLieu({ sections: [{ titre: "t".repeat(LIMITES_CARTE.titreSection + 1), elements: [] }] }).ok, false);
  assert.equal(validerCarteDuLieu({ sections: [{ titre: "Plats" }] }).ok, false);
  assert.deepEqual(validerCarteDuLieu(null), { ok: false, erreur: "carte-invalide", champ: "autre", section: null, element: null });
  assert.deepEqual(validerCarteDuLieu({ sections: "tout" }), { ok: false, erreur: "carte-invalide", champ: "autre", section: null, element: null });
});

test("validerCarteDuLieu : limites de taille", () => {
  const sections = (n: number, parSection: number) => Array.from({ length: n }, (_, i) => ({ titre: `Section ${i + 1}`, elements: Array.from({ length: parSection }, () => element()) }));
  assert.equal(validerCarteDuLieu({ sections: sections(LIMITES_CARTE.sections, 0) }).ok, true);
  assert.deepEqual(validerCarteDuLieu({ sections: sections(LIMITES_CARTE.sections + 1, 0) }), { ok: false, erreur: "carte-invalide", champ: "trop-de-sections", section: null, element: null });
  assert.deepEqual(validerCarteDuLieu({ sections: sections(1, LIMITES_CARTE.elementsParSection + 1) }), { ok: false, erreur: "carte-invalide", champ: "trop-d-elements", section: 0, element: null });
  // 5 sections de 50 = 250 : la limite ; une de plus la dépasse
  assert.equal(validerCarteDuLieu({ sections: sections(5, 50) }).ok, true);
  const trop = sections(6, 50);
  assert.deepEqual(validerCarteDuLieu({ sections: trop }), { ok: false, erreur: "carte-invalide", champ: "trop-d-elements", section: null, element: null });
});
