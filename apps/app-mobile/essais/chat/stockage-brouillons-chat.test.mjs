import assert from "node:assert/strict";
import { test } from "node:test";

import { lireAstuceDoubleToucherVue, noterAstuceDoubleToucherVue } from "~/stockage/astuce-double-toucher";
import { chargerBrouillonsChat, ecouterBrouillonsChat, effacerBrouillonsChat, enregistrerBrouillonChat, lireBrouillonsChatEnMemoire } from "~/stockage/brouillons-chat";

const CLE = "sosmiam.brouillons-chat";
const magasin = () => (globalThis.__magasin ??= new Map());

test("brouillons gardés illisibles : on repart d'une liste vide, sans planter", async () => {
  magasin().set(CLE, "{pas du json");
  assert.equal((await chargerBrouillonsChat()).size, 0);
  assert.equal(lireBrouillonsChatEnMemoire().size, 0);
});

test("un brouillon enregistré est gardé, et ceux qui écoutent sont prévenus", async () => {
  let prevenus = 0;
  const arreter = ecouterBrouillonsChat(() => {
    prevenus += 1;
  });
  await enregistrerBrouillonChat("prive-lea", "Je réserve pour 4 ?");
  arreter();
  await enregistrerBrouillonChat("prive-ines", "Merci pour les choux");
  assert.equal(prevenus, 1);
  assert.equal(lireBrouillonsChatEnMemoire().get("prive-lea").texte, "Je réserve pour 4 ?");
  const garde = JSON.parse(magasin().get(CLE));
  assert.deepEqual(Object.keys(garde).sort(), ["prive-ines", "prive-lea"]);
  assert.equal(garde["prive-lea"].texte, "Je réserve pour 4 ?");
});

test("message envoyé ou champ vidé : le brouillon disparaît", async () => {
  await enregistrerBrouillonChat("prive-lea", "");
  assert.equal(lireBrouillonsChatEnMemoire().has("prive-lea"), false);
  assert.deepEqual(Object.keys(JSON.parse(magasin().get(CLE))), ["prive-ines"]);
});

test("« Effacer mes données » : plus aucun brouillon, ni en mémoire ni sur le téléphone", async () => {
  await effacerBrouillonsChat();
  assert.equal(magasin().has(CLE), false);
  assert.equal(lireBrouillonsChatEnMemoire().size, 0);
  assert.equal((await chargerBrouillonsChat()).size, 0);
});

test("l'astuce du double toucher : pas vue au départ, vue une fois notée", async () => {
  assert.equal(await lireAstuceDoubleToucherVue(), false);
  await noterAstuceDoubleToucherVue();
  assert.equal(await lireAstuceDoubleToucherVue(), true);
  assert.equal(magasin().get("sosmiam.astuce-double-toucher"), "1");
});
