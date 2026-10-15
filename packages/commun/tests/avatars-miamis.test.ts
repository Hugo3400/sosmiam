import { test } from "node:test";
import assert from "node:assert/strict";

import { AVATAR_CAPITAINE, AVATARS_MIAMIS, PREFIXE_AVATAR_MIAMI } from "../src/regles/avatars-miamis.ts";
import { estEmojiSeul } from "../src/validation/est-emoji-seul.ts";
import { lireAvatarMiami } from "../src/validation/lire-avatar-miami.ts";

test("avatars des Miamis : seize identifiants distincts, chacun tient dans la colonne d'avatar (16 caractères)", () => {
  assert.equal(AVATARS_MIAMIS.length, 16);
  const ids = [...AVATARS_MIAMIS.map((m) => m.id), AVATAR_CAPITAINE.id];
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.match(id, /^[a-z]+$/, id);
    assert.ok(`${PREFIXE_AVATAR_MIAMI}${id}`.length <= 16, id);
  }
});

test("lireAvatarMiami : reconnaît chaque Miami au choix, le Capitaine comme réservé", () => {
  for (const { id, nom } of AVATARS_MIAMIS) assert.deepEqual(lireAvatarMiami(`miami:${id}`), { id, nom, reserve: false });
  assert.deepEqual(lireAvatarMiami("miami:capitaine"), { id: "capitaine", nom: "Capitaine Bouiboui", reserve: true });
});

test("lireAvatarMiami : null pour un emoji, rien, un Miami inconnu ou une forme approchante", () => {
  for (const valeur of ["🦊", "", null, undefined, 42, "miami:", "miami:licorne", "Miami:toque", " miami:toque", "miami:toque ", "miami:TOQUE", "toque", "miami4821"]) {
    assert.equal(lireAvatarMiami(valeur), null, String(valeur));
  }
});

test("un Miami n'est jamais pris pour un emoji (les deux formes ne se mélangent pas)", () => {
  for (const { id } of AVATARS_MIAMIS) assert.equal(estEmojiSeul(`miami:${id}`), false);
});
