import { test } from "node:test";
import assert from "node:assert/strict";

import { creerCompteApi } from "../src/client-api/api/api-compte.ts";
import type { ClientHttp } from "../src/client-api/client-http.ts";
import { construireAdressePhotoProfil } from "../src/fonctions/compte/construire-adresse-photo-profil.ts";
import { ecrireAvatarPhoto } from "../src/fonctions/compte/ecrire-avatar-photo.ts";
import { FORME_NOM_PHOTO_PROFIL } from "../src/regles/photo-profil.ts";
import { lireAvatarMiami } from "../src/validation/lire-avatar-miami.ts";
import { lireAvatarPhoto } from "../src/validation/lire-avatar-photo.ts";

const NOM = "3f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f.jpg";
const MEDIAS = "https://api.sosmiam.fr/app/medias";

test("lireAvatarPhoto : le nom de la photo d'un avatar « photo:<uuid>.jpg »", () => {
  assert.equal(lireAvatarPhoto(`photo:${NOM}`), NOM);
  assert.equal(lireAvatarPhoto(ecrireAvatarPhoto(NOM)), NOM);
  assert.match(NOM, FORME_NOM_PHOTO_PROFIL);
});

test("lireAvatarPhoto : null pour un emoji, un Miami, rien ou une forme approchante", () => {
  const refuses = [
    "🦊", "miami:toque", "", null, undefined, 42, "photo:", `Photo:${NOM}`, ` photo:${NOM}`, `photo:${NOM} `, `photo:${NOM.toUpperCase()}`,
    `photo:${NOM.replace(".jpg", ".png")}`, `photo:../${NOM}`, `photo:${NOM}/..`, "photo:3f2b8c1e-7a4b-1c1d-9e2f-3a4b5c6d7e8f.jpg", NOM,
  ];
  for (const valeur of refuses) assert.equal(lireAvatarPhoto(valeur), null, String(valeur));
  assert.equal(lireAvatarMiami(`photo:${NOM}`), null, "une photo n'est jamais prise pour un Miami");
});

test("construireAdressePhotoProfil : l'adresse publique, à partir de l'avatar et de l'adresse des médias", () => {
  assert.equal(construireAdressePhotoProfil(`photo:${NOM}`, MEDIAS), `${MEDIAS}/profils/${NOM}`);
  assert.equal(construireAdressePhotoProfil(`photo:${NOM}`, `${MEDIAS}//`), `${MEDIAS}/profils/${NOM}`);
  assert.equal(construireAdressePhotoProfil(`photo:${NOM}`, "http://127.0.0.1:5192/app/medias/"), `http://127.0.0.1:5192/app/medias/profils/${NOM}`);
  for (const avatar of ["🦊", "miami:toque", null, undefined, "photo:pas-un-nom.jpg"]) assert.equal(construireAdressePhotoProfil(avatar, MEDIAS), null, String(avatar));
  assert.equal(construireAdressePhotoProfil(`photo:${NOM}`, " "), null);
});

test("client : envoyerPhotoProfil poste les octets en image/jpeg, retirerPhotoProfil fait un DELETE", async () => {
  const appels: unknown[][] = [];
  const client = {
    envoyerOctets: async (...a: unknown[]) => (appels.push(["octets", ...a]), { ok: true, avatar: `photo:${NOM}` }),
    demander: async (...a: unknown[]) => (appels.push(["demander", ...a]), { ok: true, avatar: "🦊" }),
  } as unknown as ClientHttp;
  const comptes = creerCompteApi(client);
  const octets = new Uint8Array([0xff, 0xd8, 0xff]);
  assert.deepEqual(await comptes.envoyerPhotoProfil(octets), { ok: true, avatar: `photo:${NOM}` });
  assert.deepEqual(await comptes.retirerPhotoProfil(), { ok: true, avatar: "🦊" });
  assert.deepEqual(appels, [["octets", "/comptes/moi/photo", octets, "image/jpeg"], ["demander", "DELETE", "/comptes/moi/photo"]]);
});
