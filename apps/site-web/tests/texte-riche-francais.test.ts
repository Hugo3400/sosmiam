import assert from "node:assert/strict";
import { test } from "node:test";

import { decouperTexteRiche } from "../src/fonctions/texte/decouper-texte-riche.ts";

test("texte riche : {fr:…} marque un passage en français, à côté du gras et des liens", () => {
  assert.deepEqual(decouperTexteRiche("the {fr:conciliateur de justice} (a free, court-appointed conciliator), **free**, [see](/cgu)."), [
    { type: "texte", texte: "the " },
    { type: "francais", texte: "conciliateur de justice" },
    { type: "texte", texte: " (a free, court-appointed conciliator), " },
    { type: "gras", texte: "free" },
    { type: "texte", texte: ", " },
    { type: "lien", texte: "see", href: "/cgu" },
    { type: "texte", texte: "." },
  ]);
  assert.deepEqual(decouperTexteRiche("Rien à baliser : {pas une marque} ni fr:seul."), [{ type: "texte", texte: "Rien à baliser : {pas une marque} ni fr:seul." }]);
});
