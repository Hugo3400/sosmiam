import assert from "node:assert/strict";
import { test } from "node:test";

import { choisirLienStore } from "~/fonctions/version/choisir-lien-store";

test("iPhone : la fiche App Store de SOS Miam", () => {
  assert.equal(choisirLienStore("ios"), "https://apps.apple.com/app/id6820551130");
});

test("Android : la fiche Google Play de SOS Miam", () => {
  assert.equal(choisirLienStore("android"), "https://play.google.com/store/apps/details?id=fr.sosmiam.app");
});

test("web ou inconnu : pas de store", () => {
  for (const plateforme of ["web", "windows", null, undefined, ""]) assert.equal(choisirLienStore(plateforme), null, String(plateforme));
});
