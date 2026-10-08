// Tests des messages de modération : ce que le règlement européen demande (art. 17) et rien de plus que les CGU.
import assert from "node:assert/strict";
import { test } from "node:test";

import { creerMessageAuteur } from "../src/fonctions/moderation/creer-message-auteur.ts";
import { creerReponseSignalement } from "../src/fonctions/moderation/creer-reponse-signalement.ts";

const base = { motif: "vie-privee", motivation: "La vidéo montre un client filmé sans son accord, visage visible.", contenu: "ta vidéo sur Chez Lia", masqueeDesLeSignalement: false, reexamen: false };

test("contenu retiré : ce qu'on a fait, la règle des CGU, les faits, une décision humaine, comment contester", () => {
  const message = creerMessageAuteur({ ...base, decision: "retenu" });
  assert.ok(message.includes("On a retiré ta vidéo sur Chez Lia de SOS Miam"));
  assert.ok(message.includes("https://sosmiam.fr/cgu") && message.includes("filmer ou montrer quelqu'un sans son accord"));
  assert.ok(message.includes(base.motivation));
  assert.ok(message.includes("pas un algorithme"));
  assert.ok(message.includes("on réexaminera la décision") && message.includes("saisir la justice"));
  assert.ok(!message.includes("masqué pour tout le monde"));
  assert.ok(creerMessageAuteur({ ...base, decision: "retenu", masqueeDesLeSignalement: true }).includes("masqué pour tout le monde dès le premier signalement"));
});

test("réexamen : décision maintenue (justice seulement) ou contenu remis en ligne", () => {
  const maintenu = creerMessageAuteur({ ...base, decision: "retenu", reexamen: true });
  assert.ok(maintenu.includes("on la maintient") && !maintenu.includes("on réexaminera"));
  assert.ok(creerMessageAuteur({ ...base, decision: "rejete", reexamen: true }).includes("de nouveau en ligne"));
});

test("réponse à la personne qui a signalé : la décision et comment la contester", () => {
  const retenu = creerReponseSignalement({ decision: "retenu", motif: "haine", dateSignalement: "8 oct. 2026", contenu: "une vidéo sur Chez Lia" });
  assert.ok(retenu.includes("on l'a retiré") && retenu.includes("haine ou harcèlement") && retenu.includes("on la réexaminera"));
  assert.ok(creerReponseSignalement({ decision: "rejete", motif: null, dateSignalement: "8 oct. 2026", contenu: "une vidéo" }).includes("il reste en ligne"));
});
