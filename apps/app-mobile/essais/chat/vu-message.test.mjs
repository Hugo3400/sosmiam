import assert from "node:assert/strict";
import { test } from "node:test";

import { decrireVuMessage } from "~/fonctions/chat/decrire-vu-message";
import { estMessageLu } from "~/fonctions/chat/est-message-lu";

process.env.TZ = "Europe/Paris";
const MAINTENANT = new Date(2026, 9, 22, 19, 20);
const ilYa = (minutes) => new Date(MAINTENANT.getTime() - minutes * 60_000).toISOString();
const PRENOMS = { lea: "Léa", karim: "Karim", tom: "Tom", ines: "Inès" };
const prenomDe = (id) => PRENOMS[id] ?? null;
const vu = (lectures, o = {}) => decrireVuMessage({ messageId: "120", ordre: [], lectures, prive: false, prenomDe, maintenant: MAINTENANT, langue: "fr", ...o });

test("lu jusqu'où : les numéros du serveur se comparent en nombres", () => {
  assert.equal(estMessageLu("120", "120", []), true);
  assert.equal(estMessageLu("1000", "999", []), true);
  assert.equal(estMessageLu("99", "120", []), false);
  assert.equal(estMessageLu("0120", "120", []), true);
});

test("lu jusqu'où : en démo, l'ordre des messages de la discussion", () => {
  const ordre = ["chat-a", "chat-b", "chat-c"];
  assert.equal(estMessageLu("chat-c", "chat-b", ordre), true);
  assert.equal(estMessageLu("chat-a", "chat-b", ordre), false);
  assert.equal(estMessageLu("chat-z", "chat-b", ordre), false);
});

test("privé : « Vu · il y a 2 min », ou « Vu » seul sans l'heure de lecture", () => {
  assert.deepEqual(vu([{ membre: "lea", luJusqua: "120", luLe: ilYa(2) }], { prive: true }), { vu: "Vu · il y a 2 min", lu: "Vu il y a 2 minutes" });
  assert.deepEqual(vu([{ membre: "lea", luJusqua: "125" }], { prive: true }), { vu: "Vu", lu: "Vu" });
});

test("rien de montré quand personne n'a lu jusque-là, ou sans les champs du serveur", () => {
  assert.equal(vu([{ membre: "lea", luJusqua: "119", luLe: ilYa(1) }], { prive: true }), null);
  assert.equal(vu(undefined, { prive: true }), null);
  assert.equal(vu([]), null);
});

test("groupe : les prénoms de ceux qui ont lu, et l'heure de la lecture la plus récente", () => {
  assert.deepEqual(vu([{ membre: "lea", luJusqua: "120", luLe: ilYa(5) }, { membre: "karim", luJusqua: "130", luLe: ilYa(1) }, { membre: "tom", luJusqua: "100", luLe: ilYa(0) }]), {
    vu: "Vu par Léa et Karim · il y a 1 min",
    lu: "Vu par Léa et Karim, il y a 1 minute",
  });
  assert.equal(vu([{ membre: "lea", luJusqua: "120" }]).vu, "Vu par Léa");
  assert.equal(vu([{ membre: "lea", luJusqua: "120" }, { membre: "karim", luJusqua: "121" }, { membre: "tom", luJusqua: "122" }]).vu, "Vu par Léa, Karim et Tom");
});

test("groupe : au-delà de trois, ou quelqu'un qu'on ne connaît plus, le nombre seul", () => {
  const quatre = ["lea", "karim", "tom", "ines"].map((membre) => ({ membre, luJusqua: "120", luLe: ilYa(3) }));
  assert.deepEqual(vu(quatre), { vu: "Vu par 4 · il y a 3 min", lu: "Vu par 4 personnes, il y a 3 minutes" });
  assert.equal(vu([{ membre: "lea", luJusqua: "120" }, { membre: "inconnu", luJusqua: "120" }]).vu, "Vu par 2");
});

test("en anglais : « Seen », « Seen by Léa and Karim », « 4 people »", () => {
  assert.deepEqual(vu([{ membre: "lea", luJusqua: "120", luLe: ilYa(2) }], { prive: true, langue: "en" }), { vu: "Seen · 2 min ago", lu: "Seen 2 minutes ago" });
  assert.deepEqual(vu([{ membre: "lea", luJusqua: "120", luLe: ilYa(5) }, { membre: "karim", luJusqua: "130", luLe: ilYa(1) }], { langue: "en" }), {
    vu: "Seen by Léa and Karim · 1 min ago",
    lu: "Seen by Léa and Karim, 1 minute ago",
  });
  const quatre = ["lea", "karim", "tom", "ines"].map((membre) => ({ membre, luJusqua: "120", luLe: ilYa(3) }));
  assert.deepEqual(vu(quatre, { langue: "en" }), { vu: "Seen by 4 · 3 min ago", lu: "Seen by 4 people, 3 minutes ago" });
});
