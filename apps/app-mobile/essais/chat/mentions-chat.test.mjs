import assert from "node:assert/strict";
import { test } from "node:test";

import { decouperMentions } from "~/fonctions/chat/decouper-mentions";
import { insererMention } from "~/fonctions/chat/inserer-mention";
import { listerMentionsMessage } from "~/fonctions/chat/lister-mentions-message";
import { trouverMentionEnCours } from "~/fonctions/chat/trouver-mention-en-cours";

test("la mention en train de s'écrire, juste avant le curseur", () => {
  assert.deepEqual(trouverMentionEnCours("Salut @Le", 9), { debut: 7, recherche: "le" });
  assert.deepEqual(trouverMentionEnCours("@", 1), { debut: 1, recherche: "" });
  assert.deepEqual(trouverMentionEnCours("Salut @lea et toi", 10), { debut: 7, recherche: "lea" });
  assert.equal(trouverMentionEnCours("contact@sosmiam", 15), null);
  assert.equal(trouverMentionEnCours("Salut @lea et toi", 17), null);
  assert.equal(trouverMentionEnCours("", 0), null);
});

test("choisir un pote : son pseudo et une espace, le curseur juste après", () => {
  assert.deepEqual(insererMention("Salut @le", 7, 9, "lea.croque"), { texte: "Salut @lea.croque ", curseur: 18 });
  assert.deepEqual(insererMention("@ka on y va ?", 1, 3, "karim.mtp"), { texte: "@karim.mtp on y va ?", curseur: 11 });
});

test("dans la bulle : seuls les pseudos des membres ressortent", () => {
  const pseudos = new Set(["lea.croque", "karim.mtp"]);
  assert.deepEqual(decouperMentions("@Lea.Croque tu réserves ? cc @inconnu et contact@sosmiam.fr", pseudos), [
    { texte: "@Lea.Croque", mention: true },
    { texte: " tu réserves ? cc ", mention: false },
    { texte: "@inconnu", mention: false },
    { texte: " et contact@sosmiam.fr", mention: false },
  ]);
  assert.deepEqual(decouperMentions("Merci @karim.mtp.", pseudos), [
    { texte: "Merci ", mention: false },
    { texte: "@karim.mtp", mention: true },
    { texte: ".", mention: false },
  ]);
  assert.deepEqual(decouperMentions("Pas de mention", pseudos), [{ texte: "Pas de mention", mention: false }]);
  assert.deepEqual(decouperMentions("@lea.croque", new Set()), [{ texte: "@lea.croque", mention: false }]);
  assert.deepEqual(decouperMentions("", pseudos), []);
});

test("qui est mentionné : les membres de la discussion, sans doublon, 5 au plus", () => {
  const membres = ["lea", "karim", "tom", "ines", "sofia", "max"].map((id) => ({ id, pseudo: `${id}.mtp` }));
  assert.deepEqual(listerMentionsMessage("@karim.mtp et @lea.mtp, @karim.mtp encore", membres), ["karim", "lea"]);
  assert.deepEqual(listerMentionsMessage("@inconnu.mtp salut", membres), []);
  assert.deepEqual(listerMentionsMessage("Sans arobase", membres), []);
  const tous = membres.map((m) => `@${m.pseudo}`).join(" ");
  assert.deepEqual(listerMentionsMessage(tous, membres), ["lea", "karim", "tom", "ines", "sofia"]);
});
