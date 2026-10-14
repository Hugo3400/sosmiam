import { test } from "node:test";
import assert from "node:assert/strict";

import { peutVoirListe } from "../src/fonctions/social/peut-voir-liste.ts";
import { LONGUEUR_MAX_DESCRIPTION_LISTE, LONGUEUR_MAX_TITRE_LISTE, VISIBILITES_LISTE } from "../src/regles/listes.ts";
import { validerNouvelleListe } from "../src/validation/valider-nouvelle-liste.ts";

const liste = { titre: " Brunchs du dimanche ", emoji: " 🥞 ", description: " Les meilleurs de la ville ", visibilite: "tous" };

test("nouvelle liste : nettoyée et rendue, description facultative", () => {
  assert.deepEqual(validerNouvelleListe(liste), {
    ok: true,
    liste: { titre: "Brunchs du dimanche", emoji: "🥞", description: "Les meilleurs de la ville", visibilite: "tous" },
  });
  const sansDescription = validerNouvelleListe({ ...liste, description: undefined });
  assert.equal(sansDescription.ok && sansDescription.liste.description, "");
  const descriptionVide = validerNouvelleListe({ ...liste, description: "   " });
  assert.equal(descriptionVide.ok && descriptionVide.liste.description, "");
  assert.equal(validerNouvelleListe({ ...liste, description: null }).ok, true);
});

test("nouvelle liste : titre de 40 caractères, description de 140", () => {
  assert.equal(LONGUEUR_MAX_TITRE_LISTE, 40);
  assert.equal(LONGUEUR_MAX_DESCRIPTION_LISTE, 140);
  assert.equal(validerNouvelleListe({ ...liste, titre: "t".repeat(40) }).ok, true);
  assert.deepEqual(validerNouvelleListe({ ...liste, titre: "t".repeat(41) }), { ok: false, champ: "titre" });
  assert.deepEqual(validerNouvelleListe({ ...liste, titre: "  " }), { ok: false, champ: "titre" });
  assert.equal(validerNouvelleListe({ ...liste, description: "d".repeat(140) }).ok, true);
  assert.deepEqual(validerNouvelleListe({ ...liste, description: "d".repeat(141) }), { ok: false, champ: "description" });
  assert.deepEqual(validerNouvelleListe({ ...liste, description: 3 }), { ok: false, champ: "description" });
  assert.deepEqual(validerNouvelleListe({ ...liste, emoji: "brunch" }), { ok: false, champ: "emoji" });
});

test("nouvelle liste : « tous » ou « bande », rien d'autre", () => {
  assert.deepEqual([...VISIBILITES_LISTE], ["tous", "bande"]);
  assert.equal(validerNouvelleListe({ ...liste, visibilite: "bande" }).ok, true);
  assert.deepEqual(validerNouvelleListe({ ...liste, visibilite: "amis" }), { ok: false, champ: "visibilite" });
  assert.deepEqual(validerNouvelleListe({ ...liste, visibilite: undefined }), { ok: false, champ: "visibilite" });
});

test("nouvelle liste : pas de mot interdit, ni dans le titre ni dans la description", () => {
  assert.deepEqual(validerNouvelleListe({ ...liste, titre: "Les restos des connards" }), { ok: false, champ: "titre", raison: "mot-interdit" });
  assert.deepEqual(validerNouvelleListe({ ...liste, description: "Pour les connards" }), { ok: false, champ: "description", raison: "mot-interdit" });
  assert.equal(validerNouvelleListe({ ...liste, titre: "Pain bâtard et croissants" }).ok, true);
});

test("voir une liste : co-auteur toujours ; « bande » pour sa bande ; « tous » à partir de la vitrine", () => {
  const tous = { visibilite: "tous" as const };
  const bande = { visibilite: "bande" as const };
  assert.equal(peutVoirListe(bande, "bande", false), true);
  assert.equal(peutVoirListe(bande, "public", false), false);
  assert.equal(peutVoirListe(bande, "prive", false), false);
  assert.equal(peutVoirListe(bande, "public", true), true);
  assert.equal(peutVoirListe(tous, "bande", false), true);
  assert.equal(peutVoirListe(tous, "public", false), true);
  assert.equal(peutVoirListe(tous, "prive", false), false);
  assert.equal(peutVoirListe(tous, "prive", true), true);
});
