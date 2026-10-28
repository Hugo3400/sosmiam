import assert from "node:assert/strict";
import { test } from "node:test";

import { filtrerConversations } from "~/fonctions/chat/filtrer-conversations";
import { listerNomsConversation } from "~/fonctions/chat/lister-noms-conversation";

const pote = (id, prenom, pseudo) => ({ id, prenom, pseudo, avatar: "🦊", ville: "Sète", points: 0, pointsDuMois: 0, rescoussesDuMois: 0, lieuxSauves: [], gardes: [], badges: [] });
const POTES = new Map([
  ["lea", pote("lea", "Léa", "lea.croque")],
  ["karim", pote("karim", "Karim", "karim_mtp")],
  ["zoe", pote("zoe", "Zoé", "zoe.coeur")],
  ["ines", pote("ines", "Inès", "ines.miam")],
]);
const trouverPote = (id) => POTES.get(id) ?? null;
const prive = (id, autre) => ({ id, type: "prive", participants: ["moi", autre], creePar: "moi", messages: [] });
const groupe = (id, titre, membres) => ({ id, type: "groupe", titre, emoji: "🎲", participants: ["moi", ...membres], creePar: "moi", messages: [] });

const CONVERSATIONS = [
  prive("p-lea", "lea"),
  groupe("g-sete", "Les gourmands de Sète", ["karim", "zoe"]),
  prive("p-karim", "karim"),
  groupe("g-coeur", "Club Cœur de pâte", ["ines"]),
  prive("p-parti", "fantome"),
  groupe("g-sans-titre", "  ", ["lea"]),
];
const AUCUN_BLOQUE = new Set();
const noms = (bloques = AUCUN_BLOQUE) => (c) => listerNomsConversation(c, "moi", trouverPote, bloques, "fr");
const chercher = (recherche, bloques) => filtrerConversations(CONVERSATIONS, recherche, noms(bloques)).map((c) => c.id);

test("recherche vide ou faite d'espaces : toutes les conversations, la même liste", () => {
  assert.equal(filtrerConversations(CONVERSATIONS, "", noms()), CONVERSATIONS);
  assert.equal(filtrerConversations(CONVERSATIONS, "   ", noms()), CONVERSATIONS);
  assert.equal(filtrerConversations(CONVERSATIONS, "@", noms()), CONVERSATIONS);
});

test("sans accents ni majuscules : « LEA » et « léa » trouvent Léa (et le groupe où elle est), « Lé » aussi « Les gourmands »", () => {
  assert.deepEqual(chercher("LEA"), ["p-lea", "g-sans-titre"]);
  assert.deepEqual(chercher("léa"), ["p-lea", "g-sans-titre"]);
  assert.deepEqual(chercher("Lé"), ["p-lea", "g-sete", "g-sans-titre"]);
});

test("titre d'un groupe : « sete », « coeur de pate », « Groupe » quand il n'a pas de titre", () => {
  assert.deepEqual(chercher("sete"), ["g-sete"]);
  assert.deepEqual(chercher("coeur de pate"), ["g-coeur"]);
  assert.deepEqual(chercher("CŒUR"), ["g-sete", "g-coeur"]);
  assert.deepEqual(chercher("GOURMANDS"), ["g-sete"]);
  assert.deepEqual(chercher("groupe"), ["g-sans-titre"]);
});

test("pseudo, avec ou sans « @ »", () => {
  assert.deepEqual(chercher("@karim_mtp"), ["g-sete", "p-karim"]);
  assert.deepEqual(chercher("lea.cro"), ["p-lea", "g-sans-titre"]);
  assert.deepEqual(chercher("@ines.miam"), ["g-coeur"]);
});

test("compte supprimé : on le retrouve par « Compte supprimé »", () => {
  assert.deepEqual(chercher("compte supp"), ["p-parti"]);
});

test("une personne bloquée ne fait plus trouver ses conversations par son nom", () => {
  assert.deepEqual(chercher("karim", new Set(["karim"])), []);
  assert.deepEqual(chercher("zoé", new Set(["karim"])), ["g-sete"]);
});

test("rien qui corresponde : une liste vide", () => {
  assert.deepEqual(chercher("tartiflette"), []);
});

test("les noms d'une conversation : sans toi, prénom puis pseudo de chacun", () => {
  assert.deepEqual(listerNomsConversation(CONVERSATIONS[0], "moi", trouverPote, AUCUN_BLOQUE, "fr"), ["Léa", "lea.croque"]);
  assert.deepEqual(listerNomsConversation(CONVERSATIONS[1], "moi", trouverPote, AUCUN_BLOQUE, "fr"), ["Les gourmands de Sète", "Karim", "karim_mtp", "Zoé", "zoe.coeur"]);
  assert.deepEqual(listerNomsConversation(CONVERSATIONS[4], "moi", trouverPote, AUCUN_BLOQUE, "fr"), ["Compte supprimé"]);
  assert.deepEqual(listerNomsConversation(CONVERSATIONS[4], "moi", trouverPote, AUCUN_BLOQUE, "en"), ["Deleted account"]);
});
