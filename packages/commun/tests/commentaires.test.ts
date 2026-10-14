import { test } from "node:test";
import assert from "node:assert/strict";

import { creerMotifMention } from "../src/fonctions/commentaires/creer-motif-mention.ts";
import { extraireMentions } from "../src/fonctions/commentaires/extraire-mentions.ts";
import { trierCommentaires } from "../src/fonctions/commentaires/trier-commentaires.ts";
import type { Commentaire, CommentaireApi } from "../src/types/commentaires.ts";

test("mentions : les pseudos valables, sans doublon ni adresse e-mail, point final laissé dehors", () => {
  assert.deepEqual(extraireMentions("Merci @Lea.Croque et @tom_42 ! Et encore @lea.croque."), ["lea.croque", "tom_42"]);
  assert.deepEqual(extraireMentions("Écris à contact@sosmiam.fr"), []);
  assert.deepEqual(extraireMentions(`@${"a".repeat(25)} trop long`), []);
  assert.deepEqual(extraireMentions("@lea..croque"), []);
  assert.deepEqual([..."Salut @lea !".matchAll(creerMotifMention())].map((m) => m[1]), ["@lea"]);
  // Nouveau à chaque appel : un motif global garde sa position, on ne le partage pas
  assert.notEqual(creerMotifMention(), creerMotifMention());
});

const demo = (c: Partial<Commentaire> & Pick<Commentaire, "id" | "auteur" | "date">): Commentaire => ({
  publicationId: "p1",
  texte: "Miam",
  jaimes: [],
  mentions: [],
  ...c,
});

test("tri (démo) : le lieu en tête, puis les plus aimés, puis les plus récents ; réponses dessous, des plus anciennes", () => {
  const fil = trierCommentaires(
    [
      demo({ id: "a", auteur: "sofia", date: "2026-10-14T10:00:00Z", jaimes: ["moi"] }),
      demo({ id: "b", auteur: "tom", date: "2026-10-14T11:00:00Z" }),
      demo({ id: "c", auteur: "lieu", date: "2026-10-14T09:00:00Z" }),
      demo({ id: "d", auteur: "lea", date: "2026-10-14T12:00:00Z", jaimes: ["moi", "tom"] }),
      demo({ id: "r2", auteur: "moi", date: "2026-10-14T13:00:00Z", reponseA: "a" }),
      demo({ id: "r1", auteur: "tom", date: "2026-10-14T12:30:00Z", reponseA: "a" }),
    ],
    { bloques: [], moi: "moi" },
  );
  assert.deepEqual(
    fil.map((f) => [f.commentaire.id, f.reponses.map((r) => r.id)]),
    [["c", []], ["d", []], ["a", ["r1", "r2"]], ["b", []]],
  );
});

test("tri (démo) : sans les bloqués ; le masqué par le lieu seulement pour son auteur ; une réponse de réponse remonte", () => {
  const commentaires = [
    demo({ id: "a", auteur: "sofia", date: "2026-10-14T10:00:00Z" }),
    demo({ id: "b", auteur: "bloque", date: "2026-10-14T11:00:00Z", reponseA: "a" }),
    demo({ id: "c", auteur: "tom", date: "2026-10-14T12:00:00Z", reponseA: "b" }),
    demo({ id: "m", auteur: "moi", date: "2026-10-14T13:00:00Z", masqueParLieu: true }),
    demo({ id: "n", auteur: "lea", date: "2026-10-14T14:00:00Z", masqueParLieu: true }),
  ];
  const fil = trierCommentaires(commentaires, { bloques: ["bloque"], moi: "moi" });
  // c répondait à b (bloqué) : il passe au premier niveau plutôt que de disparaître
  assert.deepEqual(fil.map((f) => [f.commentaire.id, f.reponses.map((r) => r.id)]), [["m", []], ["c", []], ["a", []]]);
  const sansBlocage = trierCommentaires(commentaires, { bloques: [], moi: "moi" });
  assert.deepEqual(sansBlocage.map((f) => [f.commentaire.id, f.reponses.map((r) => r.id)]), [["m", []], ["a", ["b", "c"]]]);
});

const api = (c: Partial<CommentaireApi> & Pick<CommentaireApi, "id" | "date">, auteur: string | "lieu"): CommentaireApi => ({
  publicationId: "p1",
  auteur: auteur === "lieu" ? { type: "lieu" } : { type: "personne", personne: { id: auteur, pseudo: auteur, prenom: auteur, avatar: null } },
  texte: "Miam",
  modifieLe: null,
  supprime: false,
  jaimes: 0,
  reponseA: null,
  mentions: [],
  ...c,
});

test("tri (API) : mêmes règles avec les formes de l'API (J'aime comptés, réponse du lieu, identifiants publics)", () => {
  const fil = trierCommentaires(
    [
      api({ id: "1", date: "2026-10-14T10:00:00Z", jaimes: 3 }, "sofia00000"),
      api({ id: "2", date: "2026-10-14T11:00:00Z", jaimes: 5 }, "lea0000000"),
      api({ id: "3", date: "2026-10-14T09:00:00Z" }, "lieu"),
      api({ id: "4", date: "2026-10-14T12:00:00Z", reponseA: "1" }, "tom0000000"),
      api({ id: "5", date: "2026-10-14T12:30:00Z" }, "bloque0000"),
      api({ id: "6", date: "2026-10-14T13:00:00Z", etat: "masque-par-le-lieu" }, "moi0000000"),
      api({ id: "7", date: "2026-10-14T13:30:00Z", etat: "masque-par-le-lieu" }, "ines000000"),
      api({ id: "8", date: "2026-10-14T14:00:00Z", reponseA: "99" }, "tom0000000"),
    ],
    { bloques: ["bloque0000"], moi: "moi0000000" },
  );
  assert.deepEqual(
    fil.map((f) => [f.commentaire.id, f.reponses.map((r) => r.id)]),
    [["3", []], ["2", []], ["1", ["4"]], ["8", []], ["6", []]],
  );
});
