// Tests de « Envoyer à un pote » (/app/lieux-envoyes) : un message « lieu » dans la discussion privée de chaque pote (créée
// au besoin), destinataires hors de la bande ou bloqués ignorés, même idClient rejoué sans rien de plus, lieux reçus et
// envoyés, « vus », retirés de sa vue, blocages et « Effacer pour moi ». Tout en mémoire, clé de test.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
  banc.tables.lieux.set(12, { statut: "publie", nom: "Chez Léa" });
  banc.tables.lieux.set(14, { statut: "publie", nom: "Le Kiosque" });
  banc.tables.lieux.set(13, { statut: "brouillon" });
});
after(() => banc.fermer());

const envoyer = (p: PersonneDeTest, a: (string | null)[], corps: Record<string, unknown> = {}) =>
  p.demander("POST", "/app/lieux-envoyes", { idClient: randomUUID(), lieuId: 12, a, mot: "Leur crêpe au caramel, mon dieu", ...corps });

async function trio() {
  const a = await banc.creerPersonne({ prenom: "Léa" });
  const b = await banc.creerPersonne({ prenom: "Malo" });
  const c = await banc.creerPersonne({ prenom: "Inès" });
  banc.rendrePotes(a, b);
  banc.rendrePotes(a, c);
  return { a, b, c };
}

test("envoi : un message « lieu » dans le privé de chaque pote ; ignorés : inconnus, hors de la bande, bloqués ; rejoué : rien de plus", async () => {
  const { a, b, c } = await trio();
  const horsBande = await banc.creerPersonne();
  const bloqueur = await banc.creerPersonne();
  banc.rendrePotes(a, bloqueur);
  banc.bloquer(bloqueur, a);
  banc.pushs.length = 0;
  const idClient = randomUUID();
  const r = await envoyer(a, [b.idPublic, c.idPublic, horsBande.idPublic, bloqueur.idPublic, "zzzzzzzzzz"], { idClient });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.deepEqual(r.corps.envoyes.map((l: { a: { id: string } }) => l.a.id).sort(), [b.idPublic, c.idPublic].sort());
  assert.deepEqual([...r.corps.ignores].sort(), [horsBande.idPublic, bloqueur.idPublic, "zzzzzzzzzz"].sort());
  const premier = r.corps.envoyes[0];
  assert.deepEqual([premier.de.id, premier.lieuId, premier.mot, premier.vu], [a.idPublic, 12, "Leur crêpe au caramel, mon dieu", true]);
  const messages = [...banc.tables.messages.values()].filter((m) => m.idClient === idClient);
  assert.equal(messages.length, 2);
  assert.ok(messages.every((m) => m.type === "lieu" && m.texteChiffre && !m.texteChiffre.includes("crêpe")), "lieu et mot chiffrés");
  assert.ok(messages.every((m) => banc.tables.conversations.get(m.conversationId)?.type === "prive"), "discussions privées créées");
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs.map((p) => p.message.texte), ["T'a envoyé un lieu à tester.", "T'a envoyé un lieu à tester."]);
  const rejoue = await envoyer(a, [b.idPublic, c.idPublic], { idClient });
  assert.equal(rejoue.statut, 200);
  assert.deepEqual(rejoue.corps.envoyes.map((l: { id: string }) => l.id).sort(), r.corps.envoyes.map((l: { id: string }) => l.id).sort());
  await banc.attendreEnvois();
  assert.equal(banc.pushs.length, 2, "aucune nouvelle notification");
  assert.equal([...banc.tables.messages.values()].filter((m) => m.idClient === idClient).length, 2);
});

test("refus : lieu pas publié, personne de la bande, mot interdit, champs", async () => {
  const { a, b } = await trio();
  assert.deepEqual((await envoyer(a, [b.idPublic], { lieuId: 13 })).corps, { ok: false, erreur: "lieu-inconnu" });
  const inconnu = await banc.creerPersonne();
  assert.deepEqual((await envoyer(a, [inconnu.idPublic])).corps, { ok: false, erreur: "pas-dans-la-bande" });
  assert.deepEqual((await envoyer(a, [b.idPublic], { mot: "espèce de connard" })).corps, { ok: false, erreur: "message-refuse", champ: "mot" });
  assert.equal((await envoyer(a, [b.idPublic], { mot: "x".repeat(141) })).corps.champ, "mot");
  assert.equal((await envoyer(a, [])).corps.champ, "a");
  assert.equal((await envoyer(a, [b.idPublic], { lieuId: "12" })).corps.champ, "lieuId");
  assert.equal((await envoyer(a, [b.idPublic], { idClient: undefined })).corps.champ, "idClient");
  assert.equal((await envoyer(a, [b.idPublic], { mot: null })).statut, 201, "sans mot");
});

test("reçus et envoyés : vus qui ne reculent pas, retirés de ma vue, blocage, « Effacer pour moi »", async () => {
  const { a, b, c } = await trio();
  await envoyer(a, [b.idPublic, c.idPublic]);
  await envoyer(a, [b.idPublic], { lieuId: 14, mot: null });
  const recus = (await b.demander("GET", "/app/lieux-envoyes/recus")).corps;
  assert.deepEqual(recus.lieux.map((l: { lieuId: number; vu: boolean; de: { id: string }; a: { id: string } }) => [l.lieuId, l.vu, l.de.id, l.a.id]), [
    [14, false, a.idPublic, b.idPublic],
    [12, false, a.idPublic, b.idPublic],
  ]);
  assert.equal(recus.suite, null);
  const [plusRecent, plusAncien] = recus.lieux as { id: string; conversationId: string }[];
  assert.equal((await b.demander("PUT", "/app/lieux-envoyes/vus", { jusqua: plusAncien!.id })).statut, 200);
  const vus = (await b.demander("GET", "/app/lieux-envoyes/recus")).corps.lieux.map((l: { vu: boolean }) => l.vu);
  assert.deepEqual(vus, [false, true]);
  await b.demander("PUT", "/app/lieux-envoyes/vus", { jusqua: "999999" });
  assert.deepEqual((await b.demander("GET", "/app/lieux-envoyes/recus")).corps.lieux.map((l: { vu: boolean }) => l.vu), [true, true]);
  assert.equal(banc.tables.profils.get(b.compteId)!.lieuxRecusVusJusqua, Number(plusRecent!.id), "ramené au dernier lieu reçu");
  await b.demander("PUT", "/app/lieux-envoyes/vus", { jusqua: "1" });
  assert.equal(banc.tables.profils.get(b.compteId)!.lieuxRecusVusJusqua, Number(plusRecent!.id), "ne recule jamais");
  assert.equal((await b.demander("PUT", "/app/lieux-envoyes/vus", { jusqua: "abc" })).corps.champ, "jusqua");
  // Envoyés : jamais d'accusé de lecture
  const envoyes = (await a.demander("GET", "/app/lieux-envoyes/envoyes")).corps.lieux;
  assert.equal(envoyes.length, 3);
  assert.ok(envoyes.every((l: { vu: boolean; de: { id: string } }) => l.vu && l.de.id === a.idPublic));
  // Retiré de ma vue (masque « lieu-recu ») : A n'en sait rien
  assert.equal((await b.demander("PUT", `/app/masques/lieu-recu/${plusRecent!.id}`)).statut, 200);
  assert.deepEqual((await b.demander("GET", "/app/lieux-envoyes/recus")).corps.lieux.map((l: { id: string }) => l.id), [plusAncien!.id]);
  assert.equal((await a.demander("GET", "/app/lieux-envoyes/envoyes")).corps.lieux.length, 3);
  // Effacer la discussion pour moi : plus rien d'avant
  await b.demander("POST", `/app/conversations/${plusAncien!.conversationId}/effacer`);
  assert.deepEqual((await b.demander("GET", "/app/lieux-envoyes/recus")).corps.lieux, []);
  // Blocage : ni dans les reçus, ni dans les envoyés
  assert.equal((await c.demander("GET", "/app/lieux-envoyes/recus")).corps.lieux.length, 1);
  banc.bloquer(c, a);
  assert.deepEqual((await c.demander("GET", "/app/lieux-envoyes/recus")).corps.lieux, []);
  assert.equal((await a.demander("GET", "/app/lieux-envoyes/envoyes")).corps.lieux.length, 2);
});

test("pages de 30, les plus récents d'abord ; sans profil social : rien", async () => {
  const { a, b } = await trio();
  const messagerie = banc.social.dependances.messagerie;
  for (let i = 0; i < 31; i++) {
    banc.horloge.maintenant += 1000;
    await messagerie.envoyerLieu(a.compteId, randomUUID(), 12, [b.compteId], `n°${i}`, new Date(banc.horloge.maintenant));
  }
  const page = (await b.demander("GET", "/app/lieux-envoyes/recus")).corps;
  assert.deepEqual([page.lieux.length, page.lieux[0].mot, page.lieux[29].mot], [30, "n°30", "n°1"]);
  const suite = (await b.demander("GET", `/app/lieux-envoyes/recus?apres=${page.suite}`)).corps;
  assert.deepEqual([suite.lieux.map((l: { mot: string }) => l.mot), suite.suite], [["n°0"], null]);
  assert.equal((await b.demander("GET", "/app/lieux-envoyes/recus?apres=%25%25")).statut, 400);
  const sansProfil = await banc.creerPersonne({ sansProfil: true });
  assert.deepEqual((await sansProfil.demander("GET", "/app/lieux-envoyes/recus")).corps, { ok: true, lieux: [], suite: null });
  assert.equal(banc.tables.profils.has(sansProfil.compteId), false, "aucun profil créé par une lecture");
});

test("rejoué après l'archivage du lieu : les mêmes envois (200), aucune discussion créée ; un nouvel envoi : lieu-inconnu", async () => {
  const { a, b, c } = await trio();
  banc.tables.lieux.set(16, { statut: "publie", nom: "Le Fugace" });
  const idClient = randomUUID();
  const premier = await envoyer(a, [b.idPublic], { idClient, lieuId: 16 });
  assert.equal(premier.statut, 201, JSON.stringify(premier.corps));
  banc.tables.lieux.set(16, { statut: "archive" });
  const conversations = banc.tables.conversations.size;
  const rejoue = await envoyer(a, [b.idPublic, c.idPublic], { idClient, lieuId: 16 });
  assert.equal(rejoue.statut, 200, JSON.stringify(rejoue.corps));
  assert.deepEqual(rejoue.corps.envoyes.map((l: { id: string }) => l.id), premier.corps.envoyes.map((l: { id: string }) => l.id));
  assert.deepEqual(rejoue.corps.ignores, [c.idPublic]);
  assert.equal(banc.tables.conversations.size, conversations, "aucune discussion créée avec Inès");
  assert.deepEqual((await envoyer(a, [b.idPublic], { lieuId: 16 })).corps, { ok: false, erreur: "lieu-inconnu" });
});
