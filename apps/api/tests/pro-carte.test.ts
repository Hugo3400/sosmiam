// Tests de « Ma carte » (espace pro) : lecture par le gérant et l'équipe, remplacement par le gérant seulement (vérifié
// par validerCarteDuLieu de packages/commun, date posée par le serveur), effacement, erreurs avec leur endroit, limite par
// compte, grosse carte (300 Ko) et la carte sur la fiche publique. Tout en mémoire : aucune base.
import assert from "node:assert/strict";
import { after, test } from "node:test";

import { LIMITES_CARTE } from "../../../packages/commun/src/regles/carte-du-lieu.ts";
import { presenterCarte } from "../src/fonctions/pro/presenter-carte.ts";
import { LIMITE_ENREGISTRER_CARTE } from "../src/routes/pro.ts";
import { creerBancPro } from "./outils/creer-banc-pro.ts";

const { banc, memoire, demander, creerCompte, creerGerant, fermer } = await creerBancPro();
after(fermer);

const CARTE = {
  sections: [
    {
      titre: " Les plats ",
      elements: [
        { nom: "Cacio e pepe", description: "Pecorino, poivre noir.", prix: 12.5, signature: true, etiquettes: ["fait-maison", "vege"] },
        { nom: "Tiramisu", prix: 6 },
      ],
    },
    { titre: "À boire", elements: [{ nom: "Spritz", prix: 7, unite: "le verre", alcool: true }] },
    { titre: "Bientôt", elements: [] },
  ],
};

/** Un gérant et un membre de l'équipe validé sur le même lieu */
async function creerLieuAvecEquipe() {
  const gerant = await creerGerant();
  const employe = await creerCompte("Max");
  await demander("POST", `/pro/lieux/${gerant.lieuId}/equipe`, { jeton: gerant.jeton, corps: { email: employe.email } });
  const invitation = memoire.rattachements.find((r) => r.compteId === employe.id && r.lieuId === gerant.lieuId);
  await demander("POST", `/comptes/moi/rattachements/${invitation?.id}/accepter`, { jeton: employe.jeton });
  return { gerant, employe };
}

test("pas encore de carte : { carte: null, majLe: null }, pour le gérant comme pour l'équipe", async () => {
  const { gerant, employe } = await creerLieuAvecEquipe();
  for (const { jeton } of [gerant, employe]) {
    const { statut, corps } = await demander("GET", `/pro/lieux/${gerant.lieuId}/carte`, { jeton });
    assert.deepEqual([statut, corps], [200, { ok: true, carte: null, majLe: null }]);
  }
});

test("PUT : la carte est nettoyée, gardée sans date, et la date est posée par le serveur (jour de Paris)", async () => {
  const { jeton, lieuId } = await creerGerant();
  banc.horloge = Date.parse("2026-10-09T22:30:00Z"); // déjà le 10 octobre à Paris
  const { statut, corps } = await demander("PUT", `/pro/lieux/${lieuId}/carte`, { jeton, corps: { carte: { ...CARTE, majLe: "1999-01-01" } } });
  assert.equal(statut, 200);
  const attendue = {
    sections: [
      {
        titre: "Les plats",
        elements: [
          { nom: "Cacio e pepe", description: "Pecorino, poivre noir.", prix: 12.5, signature: true, etiquettes: ["vege", "fait-maison"] },
          { nom: "Tiramisu", prix: 6 },
        ],
      },
      { titre: "À boire", elements: [{ nom: "Spritz", prix: 7, unite: "le verre", alcool: true }] },
      { titre: "Bientôt", elements: [] },
    ],
  };
  assert.deepEqual(corps, { ok: true, carte: { ...attendue, majLe: "2026-10-10" }, majLe: "2026-10-09T22:30:00.000Z" });
  assert.deepEqual(memoire.lieux.get(lieuId)?.carte, attendue, "gardée sans majLe");
  assert.equal(memoire.lieux.get(lieuId)?.carteMajLe, banc.horloge);
  const lue = await demander("GET", `/pro/lieux/${lieuId}/carte`, { jeton });
  assert.deepEqual(lue.corps, corps);
  // La fiche publique la montre aussi, alcool compris (le site n'a pas l'âge : il ajoute le message sanitaire)
  const publique = await demander("GET", `/lieux/publics/${lieuId}`);
  assert.deepEqual([publique.corps.lieu.carte, publique.corps.lieu.carteMajLe], [corps.carte, corps.majLe]);
});

test("PUT { carte: null } ou une carte sans section : la carte est effacée, sa date aussi", async () => {
  const { jeton, lieuId } = await creerGerant();
  for (const vide of [null, { sections: [] }]) {
    await demander("PUT", `/pro/lieux/${lieuId}/carte`, { jeton, corps: { carte: CARTE } });
    const { statut, corps } = await demander("PUT", `/pro/lieux/${lieuId}/carte`, { jeton, corps: { carte: vide } });
    assert.deepEqual([statut, corps], [200, { ok: true, carte: null, majLe: null }], JSON.stringify(vide));
    assert.deepEqual([memoire.lieux.get(lieuId)?.carte, memoire.lieux.get(lieuId)?.carteMajLe], [null, null]);
    assert.deepEqual((await demander("GET", `/lieux/publics/${lieuId}`)).corps.lieu.carte, null);
  }
});

test("PUT invalide : 400 carte-invalide avec le champ et l'endroit ; la carte d'avant reste", async () => {
  const { jeton, lieuId } = await creerGerant();
  await demander("PUT", `/pro/lieux/${lieuId}/carte`, { jeton, corps: { carte: CARTE } });
  const avant = structuredClone(memoire.lieux.get(lieuId)?.carte);
  const plat = (element: Record<string, unknown>) => ({ sections: [{ titre: "Plats", elements: [{ nom: "Pâtes", prix: 10 }, element] }] });
  const essais: [unknown, string, number | null, number | null][] = [
    [plat({ nom: "Gratin", prix: -1 }), "prix", 0, 1],
    [plat({ nom: "Gratin", prix: 4.505 }), "prix", 0, 1],
    [plat({ nom: "Gratin", prix: "12" }), "prix", 0, 1],
    [plat({ nom: "Gratin", prix: LIMITES_CARTE.prixMax + 1 }), "prix", 0, 1],
    [plat({ nom: "   ", prix: 3 }), "nom", 0, 1],
    [plat({ nom: "x".repeat(LIMITES_CARTE.nom + 1), prix: 3 }), "nom", 0, 1],
    [plat({ nom: "Gratin", prix: 3, description: "d".repeat(LIMITES_CARTE.description + 1) }), "description", 0, 1],
    [plat({ nom: "Gratin", prix: 3, unite: "u".repeat(LIMITES_CARTE.unite + 1) }), "unite", 0, 1],
    [plat({ nom: "Gratin", prix: 3, etiquettes: ["halal"] }), "etiquettes", 0, 1],
    [plat({ nom: "Gratin", prix: 3, alcool: "oui" }), "autre", 0, 1],
    [{ sections: [{ titre: "", elements: [] }] }, "titre", 0, null],
    [{ sections: Array.from({ length: LIMITES_CARTE.sections + 1 }, (_, i) => ({ titre: `S${i}`, elements: [] })) }, "trop-de-sections", null, null],
    [{ sections: [{ titre: "Plats", elements: Array.from({ length: LIMITES_CARTE.elementsParSection + 1 }, () => ({ nom: "P", prix: 1 })) }] }, "trop-d-elements", 0, null],
    [{ plats: [] }, "autre", null, null],
    ["une carte", "autre", null, null],
  ];
  for (const [carte, champ, section, element] of essais) {
    const reponse = await demander("PUT", `/pro/lieux/${lieuId}/carte`, { jeton, corps: { carte } });
    assert.deepEqual([reponse.statut, reponse.corps], [400, { ok: false, erreur: "carte-invalide", champ, section, element }], JSON.stringify(carte).slice(0, 80));
  }
  const sansCarte = await demander("PUT", `/pro/lieux/${lieuId}/carte`, { jeton, corps: { sections: [] } });
  assert.deepEqual([sansCarte.statut, sansCarte.corps.champ], [400, "autre"], "{ carte } absent : rien n'est effacé");
  assert.deepEqual(memoire.lieux.get(lieuId)?.carte, avant);
});

test("l'équipe lit mais ne modifie pas (403 reserve-au-gerant) ; un autre compte : 403 pas-pro", async () => {
  const { gerant, employe } = await creerLieuAvecEquipe();
  const refus = await demander("PUT", `/pro/lieux/${gerant.lieuId}/carte`, { jeton: employe.jeton, corps: { carte: CARTE } });
  assert.deepEqual([refus.statut, refus.corps], [403, { ok: false, erreur: "reserve-au-gerant" }]);
  assert.equal(memoire.lieux.get(gerant.lieuId)?.carte, undefined);
  const inconnu = await creerCompte("Inconnu");
  for (const [methode, corps] of [["GET", undefined], ["PUT", { carte: CARTE }]] as const) {
    const reponse = await demander(methode, `/pro/lieux/${gerant.lieuId}/carte`, { jeton: inconnu.jeton, corps });
    assert.deepEqual([reponse.statut, reponse.corps], [403, { ok: false, erreur: "pas-pro" }], methode);
  }
  assert.equal((await demander("GET", `/pro/lieux/${gerant.lieuId}/carte`)).statut, 401, "sans session");
});

test("une carte pleine (250 éléments aux textes les plus longs) passe ; 251 éléments non", async () => {
  const { jeton, lieuId } = await creerGerant();
  const element = { nom: "é".repeat(LIMITES_CARTE.nom), description: "à".repeat(LIMITES_CARTE.description), prix: LIMITES_CARTE.prixMax, unite: "è".repeat(LIMITES_CARTE.unite), signature: true, alcool: true, etiquettes: ["vege", "vegan", "sans-gluten", "epice", "fait-maison", "local"] };
  const parSection = [60, 60, 60, 60, 10];
  const pleine = { sections: parSection.map((nombre, i) => ({ titre: `Section ${i}`, elements: Array.from({ length: nombre }, () => element) })) };
  assert.ok(JSON.stringify({ carte: pleine }).length > 16_000, "plus grosse que la limite générale de l'espace");
  const passe = await demander("PUT", `/pro/lieux/${lieuId}/carte`, { jeton, corps: { carte: pleine } });
  assert.equal(passe.statut, 200, JSON.stringify(passe.corps));
  pleine.sections[4]?.elements.push(element);
  const trop = await demander("PUT", `/pro/lieux/${lieuId}/carte`, { jeton, corps: { carte: pleine } });
  assert.deepEqual([trop.statut, trop.corps.champ, trop.corps.section], [400, "trop-d-elements", null]);
});

test("60 enregistrements par compte et par heure, quelle que soit l'IP ; puis 429", async () => {
  const { jeton, lieuId } = await creerGerant();
  for (let i = 0; i < LIMITE_ENREGISTRER_CARTE.maximum; i++) {
    assert.equal((await demander("PUT", `/pro/lieux/${lieuId}/carte`, { jeton, corps: { carte: null } })).statut, 200);
  }
  const refus = await demander("PUT", `/pro/lieux/${lieuId}/carte`, { jeton, corps: { carte: null } });
  assert.deepEqual([refus.statut, refus.corps], [429, { ok: false, erreur: "trop-de-demandes" }]);
  assert.ok(Number(refus.entetes.get("retry-after")) > 0);
  // La lecture n'est pas comptée, et un autre gérant n'est pas gêné
  assert.equal((await demander("GET", `/pro/lieux/${lieuId}/carte`, { jeton })).statut, 200);
  const autre = await creerGerant();
  assert.equal((await demander("PUT", `/pro/lieux/${autre.lieuId}/carte`, { jeton: autre.jeton, corps: { carte: null } })).statut, 200);
});

test("presenterCarte : la date de Paris dans la carte, le moment exact à part", () => {
  assert.deepEqual(presenterCarte(null, new Date()), { carte: null, majLe: null });
  const sections = [{ titre: "Plats", elements: [] }];
  assert.deepEqual(presenterCarte({ sections }, new Date("2026-03-28T23:10:00Z")), { carte: { sections, majLe: "2026-03-29" }, majLe: "2026-03-28T23:10:00.000Z" });
  assert.deepEqual(presenterCarte({ sections }, null), { carte: { sections }, majLe: null });
});
