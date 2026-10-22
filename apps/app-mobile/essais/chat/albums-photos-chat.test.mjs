import assert from "node:assert/strict";
import { test } from "node:test";

import { construireLignesDiscussion } from "~/fonctions/chat/construire-lignes-discussion";
import { filtrerMessagesSignales } from "~/fonctions/chat/filtrer-messages-signales";
import { regrouperAlbumsChat } from "~/fonctions/chat/regrouper-albums-chat";

const photo = (id, auteur, album, autres = {}) => ({ id, auteur, date: `2026-10-22T18:0${id.length}:00.000Z`, type: "photo", reactions: {}, ...(album ? { album } : {}), ...autres });
const texte = (id, auteur) => ({ id, auteur, date: "2026-10-22T18:10:00.000Z", type: "texte", texte: "Coucou", reactions: {} });

test("album : les photos qui se suivent, même album et même auteur, font une seule bulle", () => {
  const groupes = regrouperAlbumsChat([photo("a", "lea", "alb"), photo("b", "lea", "alb"), photo("c", "lea", "alb"), texte("t", "moi")]);
  assert.equal(groupes.length, 2);
  assert.deepEqual(groupes[0].album.map((m) => m.id), ["a", "b", "c"]);
  assert.equal(groupes[0].message.id, "a");
  assert.equal(groupes[1].album, null);
});

test("album : une photo seule, sans album ou d'un autre auteur reste à part", () => {
  const groupes = regrouperAlbumsChat([photo("a", "lea", "alb"), photo("b", "lea", null), photo("c", "tom", "alb"), photo("d", "tom", "alb2")]);
  assert.deepEqual(groupes.map((g) => [g.message.id, g.album]), [["a", null], ["b", null], ["c", null], ["d", null]]);
});

test("album : un message au milieu coupe l'album en deux bulles", () => {
  const groupes = regrouperAlbumsChat([photo("a", "lea", "alb"), photo("b", "lea", "alb"), texte("t", "tom"), photo("c", "lea", "alb"), photo("d", "lea", "alb")]);
  assert.deepEqual(groupes.map((g) => g.album?.map((m) => m.id) ?? g.message.id), [["a", "b"], "t", ["c", "d"]]);
});

test("album : la bulle est portée par la première photo encore visible", () => {
  const groupes = regrouperAlbumsChat([photo("a", "lea", "alb", { etat: "supprime" }), photo("b", "lea", "alb"), photo("c", "lea", "alb")]);
  assert.equal(groupes[0].message.id, "b");
  const toutesParties = regrouperAlbumsChat([photo("a", "lea", "alb", { etat: "supprime" }), photo("b", "lea", "alb", { etat: "supprime" })]);
  assert.equal(toutesParties[0].message.id, "a");
});

test("album : une photo en cours d'envoi reste dans l'album", () => {
  const groupes = regrouperAlbumsChat([photo("envoi:1", "moi", "1", { etat: "envoi", idClient: "1" }), photo("envoi:2", "moi", "1", { etat: "echec", idClient: "2" })]);
  assert.equal(groupes.length, 1);
  assert.equal(groupes[0].message.id, "envoi:1");
});

test("lignes : un album compte pour une ligne, avec son heure et sa série", () => {
  const lignes = construireLignesDiscussion([texte("t", "lea"), photo("a", "lea", "alb"), photo("b", "lea", "alb")], () => null, new Date("2026-10-22T20:00:00.000Z"), "moi");
  assert.equal(lignes.length, 2);
  assert.equal(lignes[1].album.length, 2);
  assert.equal(lignes[1].debutSerie, false);
  assert.equal(lignes[0].album, null);
});

test("signalés : un album signalé disparaît en entier, une photo signalée seule aussi", () => {
  const messages = [photo("p1", "lea", "id-1", { idClient: "id-1" }), photo("p2", "lea", "id-1", { idClient: "id-2" }), photo("p3", "tom", null), texte("t", "tom")];
  assert.deepEqual(filtrerMessagesSignales(messages, (id) => id === "p1").map((m) => m.id), ["p3", "t"]);
  assert.deepEqual(filtrerMessagesSignales(messages, (id) => id === "p2").map((m) => m.id), ["p1", "p3", "t"]);
  assert.deepEqual(filtrerMessagesSignales(messages, () => false).length, 4);
});

test("signalés : en démo, l'album porte l'identifiant de sa première photo", () => {
  const messages = [photo("chat-1", "moi", "chat-1"), photo("chat-2", "moi", "chat-1")];
  assert.deepEqual(filtrerMessagesSignales(messages, (id) => id === "chat-1"), []);
});
