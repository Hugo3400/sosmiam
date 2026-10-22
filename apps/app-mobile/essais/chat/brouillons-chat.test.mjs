import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_BROUILLONS_CHAT } from "~/contenus/type-brouillon-chat";
import { nettoyerBrouillonsChat } from "~/fonctions/chat/nettoyer-brouillons-chat";
import { placerBrouillonChat } from "~/fonctions/chat/placer-brouillon-chat";

const AUCUN = new Map();
const le = (minute) => new Date(Date.UTC(2026, 9, 22, 18, minute)).toISOString();

test("placer un brouillon, le remplacer, le retirer quand le texte est vide", () => {
  const un = placerBrouillonChat(AUCUN, "prive-lea", "On se fait un resto ?", le(1));
  assert.deepEqual([...un], [["prive-lea", { texte: "On se fait un resto ?", le: le(1) }]]);
  const deux = placerBrouillonChat(un, "prive-lea", "On se fait une crêpe ?", le(2));
  assert.deepEqual(deux.get("prive-lea"), { texte: "On se fait une crêpe ?", le: le(2) });
  assert.equal(placerBrouillonChat(deux, "prive-lea", "", le(3)).size, 0);
  assert.equal(placerBrouillonChat(deux, "prive-lea", "  \n ", le(3)).size, 0);
  assert.equal(AUCUN.size, 0);
  assert.equal(un.get("prive-lea").texte, "On se fait un resto ?");
});

test("rien ne change : la même liste est rendue (pas de nouvelle écriture)", () => {
  const un = placerBrouillonChat(AUCUN, "a", "salut", le(1));
  assert.equal(placerBrouillonChat(un, "a", "salut", le(5)), un);
  assert.equal(placerBrouillonChat(un, "b", "", le(5)), un);
  assert.equal(placerBrouillonChat(un, "", "coucou", le(5)), un);
});

test(`${MAX_BROUILLONS_CHAT} brouillons au plus : le plus ancien part, le dernier touché reste`, () => {
  let brouillons = AUCUN;
  for (let i = 0; i < MAX_BROUILLONS_CHAT; i += 1) brouillons = placerBrouillonChat(brouillons, `c${i}`, `texte ${i}`, le(i));
  brouillons = placerBrouillonChat(brouillons, "c0", "retouché", le(55));
  brouillons = placerBrouillonChat(brouillons, "nouvelle", "bonjour", le(56));
  assert.equal(brouillons.size, MAX_BROUILLONS_CHAT);
  assert.equal(brouillons.has("c1"), false);
  assert.equal(brouillons.get("c0").texte, "retouché");
  assert.equal([...brouillons.keys()].at(-1), "nouvelle");
});

test("un texte trop long est coupé à 500 caractères sans casser un emoji", () => {
  const long = `${"a".repeat(499)}😋😋😋`;
  const garde = placerBrouillonChat(AUCUN, "a", long, le(1)).get("a").texte;
  assert.equal(Array.from(garde).length, 500);
  assert.equal(garde.endsWith("a😋"), true);
});

test("relire : ce qui n'est pas une liste de brouillons donne une liste vide", () => {
  for (const lu of [null, undefined, "texte", 12, true, [], [["a", { texte: "x", le: le(1) }]]]) assert.equal(nettoyerBrouillonsChat(lu).size, 0, String(lu));
});

test("relire : les brouillons mal formés sont ignorés, les autres gardés", () => {
  const lus = nettoyerBrouillonsChat({
    bon: { texte: "Je ramène le dessert", le: le(3) },
    vide: { texte: "   ", le: le(4) },
    sansDate: { texte: "coucou" },
    dateIllisible: { texte: "coucou", le: "hier soir" },
    texteNombre: { texte: 42, le: le(5) },
    rien: null,
    chaine: "texte",
    [""]: { texte: "sans id", le: le(6) },
    ["x".repeat(129)]: { texte: "id trop long", le: le(7) },
  });
  assert.deepEqual([...lus], [["bon", { texte: "Je ramène le dessert", le: le(3) }]]);
});

test("relire : rangés du plus ancien au plus récent, les plus récents gardés, les textes coupés", () => {
  const lu = {};
  for (let i = 0; i < 60; i += 1) lu[`c${i}`] = { texte: `texte ${i}`, le: le(59 - i) };
  lu.long = { texte: "b".repeat(800), le: le(30) };
  const lus = nettoyerBrouillonsChat(lu);
  assert.equal(lus.size, MAX_BROUILLONS_CHAT);
  assert.equal([...lus.keys()][0], "c48");
  assert.equal([...lus.keys()].at(-1), "c0");
  assert.equal(lus.get("long").texte.length, 500);
  assert.equal(lus.has("c49"), false);
});
