import assert from "node:assert/strict";
import { test } from "node:test";

import { lireConversationNotification } from "~/fonctions/notifications/lire-conversation-notification";
import { decoderUtf8 } from "~/fonctions/texte/decoder-utf8";

const octets = (texte) => new Uint8Array(Buffer.from(texte, "utf8"));

test("decoderUtf8 : accents et emoji relus tels quels ; octets abîmés : null", () => {
  for (const texte of ["", "On y va ?", "Léa : Ça marche, à 20 h 🍕🎉", "日本語 ✓"]) assert.equal(decoderUtf8(octets(texte)), texte);
  for (const abime of [[0xc3], [0xff], [0xc0, 0x80], [0xed, 0xa0, 0x80], [0xe2, 0x28, 0xa1], [0xf4, 0x90, 0x80, 0x80]]) {
    assert.equal(decoderUtf8(new Uint8Array(abime)), null, abime.join(","));
  }
});

const notification = ({ data = {}, payload, identifiant = "x" } = {}) => ({
  date: 1,
  request: { identifier: identifiant, content: { data }, trigger: payload ? { type: "push", payload } : null },
});

test("lireConversationNotification : le tag Android, le thread-id de l'iPhone ou l'identifiant ; rien d'autre", () => {
  assert.equal(lireConversationNotification(notification({ data: { tag: "conversation:42" } })), 42);
  assert.equal(lireConversationNotification(notification({ payload: { aps: { "thread-id": "conversation:7" } } })), 7);
  assert.equal(lireConversationNotification(notification({ identifiant: "conversation:9" })), 9);
  for (const tag of ["conversation:", "conversation:0", "conversation:-3", "sortie:4", "conversation:12abc", "conversation:1234567890123"]) {
    assert.equal(lireConversationNotification(notification({ data: { tag } })), null, tag);
  }
  assert.equal(lireConversationNotification(null), null);
});
