import { test } from "node:test";
import assert from "node:assert/strict";
import { validerInfosPratiques } from "../src/validation/valider-infos-pratiques.ts";

test("validerInfosPratiques : téléphone français normalisé", () => {
  assert.deepEqual(validerInfosPratiques({ telephone: "0467123456" }), { ok: true, infos: { telephone: "04 67 12 34 56" } });
  assert.deepEqual(validerInfosPratiques({ telephone: "+33 4 67 12 34 56" }), { ok: true, infos: { telephone: "04 67 12 34 56" } });
  assert.deepEqual(validerInfosPratiques({ telephone: "04.67.12.34.56" }), { ok: true, infos: { telephone: "04 67 12 34 56" } });
  assert.deepEqual(validerInfosPratiques({ telephone: "12345" }), { ok: false, erreur: "infos-invalides", champ: "telephone" });
  assert.deepEqual(validerInfosPratiques({ telephone: "0067123456" }), { ok: false, erreur: "infos-invalides", champ: "telephone" });
  assert.deepEqual(validerInfosPratiques({ telephone: "" }), { ok: true, infos: {} });
});

test("validerInfosPratiques : site en https et Instagram", () => {
  assert.deepEqual(validerInfosPratiques({ siteWeb: "https://example.com/nonna" }), { ok: true, infos: { siteWeb: "https://example.com/nonna" } });
  assert.equal(validerInfosPratiques({ siteWeb: "http://example.com" }).ok, false);
  assert.equal(validerInfosPratiques({ siteWeb: "javascript:alert(1)" }).ok, false);
  assert.equal(validerInfosPratiques({ siteWeb: "https://exemple com" }).ok, false);
  assert.deepEqual(validerInfosPratiques({ instagram: "@lea.mange" }), { ok: true, infos: { instagram: "lea.mange" } });
  assert.deepEqual(validerInfosPratiques({ instagram: "https://www.instagram.com/lea.mange/" }), { ok: true, infos: { instagram: "lea.mange" } });
  assert.equal(validerInfosPratiques({ instagram: "lea mange !" }).ok, false);
});

test("validerInfosPratiques : listes fermées et cases", () => {
  const r = validerInfosPratiques({ animaux: "terrasse", reservation: "conseillee", accessible: true, wifi: false, paiements: ["tickets-resto", "cb", "cb"] });
  assert.deepEqual(r, { ok: true, infos: { animaux: "terrasse", reservation: "conseillee", accessible: true, paiements: ["cb", "tickets-resto"] } });
  assert.equal(validerInfosPratiques({ animaux: "chats seulement" }).ok, false);
  assert.equal(validerInfosPratiques({ paiements: ["bitcoin"] }).ok, false);
  assert.equal(validerInfosPratiques({ terrasse: "oui" }).ok, false);
  assert.equal(validerInfosPratiques("tout").ok, false);
});
