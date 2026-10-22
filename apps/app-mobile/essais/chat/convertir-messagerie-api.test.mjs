import assert from "node:assert/strict";
import { test } from "node:test";

import { convertirConversationApi } from "~/fonctions/chat/convertir-conversation-api";
import { convertirMessageApi } from "~/fonctions/chat/convertir-message-api";

const personne = (id) => ({ id, pseudo: `${id}.mtp`, prenom: id, avatar: "🦊" });
const messageApi = (autre = {}) => ({
  id: "42",
  idClient: "c0ffee00-0000-4000-8000-000000000000",
  auteur: personne("lea"),
  date: "2026-10-22T19:00:00.000Z",
  type: "texte",
  texte: "@karim.mtp on y va ?",
  lieuId: null,
  media: null,
  reactions: { miam: ["karim"] },
  etat: "visible",
  ...autre,
});

test("un message de la 1.0.2 : citation, modification, mentions", () => {
  const m = convertirMessageApi(
    messageApi({ reponseA: { id: "41", auteurId: "karim", type: "texte", extrait: "Pizza ?", etat: "visible" }, modifieLe: "2026-10-22T19:05:00.000Z", mentions: ["karim"] }),
  );
  assert.deepEqual(m.reponseA, { id: "41", auteur: "karim", type: "texte", extrait: "Pizza ?", etat: "visible" });
  assert.equal(m.modifieLe, "2026-10-22T19:05:00.000Z");
  assert.deepEqual(m.mentions, ["karim"]);
  assert.deepEqual(m.reactions, { "😋": ["karim"] });
});

test("un message de SOS Miam et le petit mot d'une photo", () => {
  const systeme = convertirMessageApi(messageApi({ auteur: null, texte: "Rappel : c'est dans 1 h !", systeme: "rappel-sortie" }));
  assert.equal(systeme.auteur, "");
  assert.equal(systeme.systeme, "rappel-sortie");
  const photo = convertirMessageApi(messageApi({ type: "photo", texte: null, legende: "Regarde ça" }));
  assert.equal(photo.legende, "Regarde ça");
  assert.equal("texte" in photo, false);
});

test("sans les nouveaux champs : rien de plus qu'avant", () => {
  const m = convertirMessageApi(messageApi({ mentions: [] }));
  for (const champ of ["reponseA", "modifieLe", "legende", "systeme", "mentions"]) assert.equal(champ in m, false, champ);
});

test("une conversation : épinglée, et le « Vu » des membres seulement quand le serveur le montre", () => {
  const conversation = {
    id: "7",
    type: "groupe",
    titre: "Jeudi",
    emoji: "🎲",
    membres: [
      { personne: personne("moi"), role: "admin", depuis: "2026-10-01T00:00:00.000Z" },
      { personne: personne("lea"), role: "membre", depuis: "2026-10-01T00:00:00.000Z", luJusqua: "42", luLe: "2026-10-22T19:06:00.000Z" },
      { personne: personne("karim"), role: "membre", depuis: "2026-10-01T00:00:00.000Z", luJusqua: "40" },
      { personne: personne("tom"), role: "membre", depuis: "2026-10-01T00:00:00.000Z" },
    ],
    invites: [],
    autre: null,
    dernierMessage: messageApi(),
    dernierMessageLe: "2026-10-22T19:00:00.000Z",
    nonLus: 0,
    luJusqua: "42",
    coupee: false,
    ouverte: true,
    moi: { role: "admin" },
    sortieId: null,
    version: 3,
    epinglee: true,
  };
  const c = convertirConversationApi(conversation);
  assert.equal(c.epinglee, true);
  assert.deepEqual(c.lectures, [
    { membre: "lea", luJusqua: "42", luLe: "2026-10-22T19:06:00.000Z" },
    { membre: "karim", luJusqua: "40" },
  ]);
  const sansVu = convertirConversationApi({ ...conversation, epinglee: undefined, membres: conversation.membres.map(({ luJusqua: _l, luLe: _le, ...m }) => m) });
  assert.equal(sansVu.epinglee, false);
  assert.equal("lectures" in sansVu, false);
});
