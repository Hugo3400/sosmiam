import assert from "node:assert/strict";
import { test } from "node:test";

import { EMOJI_AVATAR_PAR_DEFAUT } from "../../../packages/commun/src/regles/avatar-par-defaut.ts";
import { presenterClientComptoir, type CompteAuComptoir } from "../src/fonctions/visites/presenter-client-comptoir.ts";

const NOM = "0f1e2d3c-4b5a-4987-8a6b-5c4d3e2f1a0b.jpg";
const client = (plus: Partial<CompteAuComptoir> = {}): CompteAuComptoir => ({
  id: 7, prenom: "Léa", avatar: "🦊", nomChiffre: null, emailVerifie: true, rattachements: [], ...plus,
});

test("comptoir : la photo de profil du client apparaît, comme partout où son avatar se voit", () => {
  assert.deepEqual(presenterClientComptoir(client({ photoProfil: NOM, limitations: [] }), null), { prenom: "Léa", initialeNom: null, avatar: `photo:${NOM}` });
});

test("comptoir : compte limité, l'équipe voit son emoji (ou l'avatar par défaut), jamais sa photo", () => {
  assert.equal(presenterClientComptoir(client({ photoProfil: NOM, limitations: [{ id: 1 }] }), null).avatar, "🦊");
  assert.equal(presenterClientComptoir(client({ avatar: null, photoProfil: NOM, limitations: [{ id: 1 }] }), null).avatar, EMOJI_AVATAR_PAR_DEFAUT);
});

test("comptoir : sans savoir si le compte est limité, pas de photo", () => {
  assert.equal(presenterClientComptoir(client({ photoProfil: NOM }), null).avatar, "🦊");
});

test("comptoir : sans photo, l'emoji ou le Miami ; sans rien, l'avatar par défaut ; compte effacé, « Quelqu'un » et 🙂", () => {
  assert.equal(presenterClientComptoir(client({ photoProfil: null, limitations: [] }), null).avatar, "🦊");
  assert.equal(presenterClientComptoir(client({ avatar: "miami:toque", limitations: [] }), null).avatar, "miami:toque");
  assert.equal(presenterClientComptoir(client({ avatar: null }), null).avatar, EMOJI_AVATAR_PAR_DEFAUT);
  assert.deepEqual(presenterClientComptoir(undefined, null), { prenom: "Quelqu'un", initialeNom: null, avatar: "🙂" });
});
