import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { QUESTION_SONDAGE } from "../../../packages/commun/src/regles/chat.ts";
import { dechiffrerLieuSondage } from "../src/fonctions/social/dechiffrer-lieu-sondage.ts";
import type { LimitationActive } from "../src/services/limitations-comptes-regles.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

const MINUTE = 60_000;
const limites = new Map<number, LimitationActive>();

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial({ estLimite: async (compteId) => limites.get(compteId) ?? null });
});
after(() => banc.fermer());

let dernierLieu = 900;
function lieu(statut = "publie", nom?: string): number {
  dernierLieu += 1;
  banc.tables.lieux.set(dernierLieu, { statut, nom: nom ?? `Chez Lulu n°${dernierLieu}` });
  return dernierLieu;
}
const dans = (minutes: number) => new Date(banc.horloge.maintenant + minutes * MINUTE).toISOString();
const lancer = (p: PersonneDeTest, id: string, lieux: unknown, finLe: unknown = dans(60), idClient: string = randomUUID()) =>
  p.demander("POST", `/app/conversations/${id}/messages`, { idClient, type: "vote", lieux, finLe });
const voter = (p: PersonneDeTest, id: string, messageId: string, ordre?: unknown) =>
  ordre === undefined ? p.demander("DELETE", `/app/conversations/${id}/sondages/${messageId}/vote`) : p.demander("PUT", `/app/conversations/${id}/sondages/${messageId}/vote`, { ordre });
const lireFil = async (p: PersonneDeTest, id: string) => (await p.demander("GET", `/app/conversations/${id}`)).corps.fil;
const passer = () => banc.social.dependances.messagerie.passerTaches(new Date(banc.horloge.maintenant));

async function groupe(n: number) {
  const admin = await banc.creerPersonne({ prenom: "Léa" });
  const membres: PersonneDeTest[] = [];
  for (let i = 0; i < n; i++) {
    const m = await banc.creerPersonne();
    banc.rendrePotes(admin, m);
    membres.push(m);
  }
  const cree = await admin.demander("POST", "/app/conversations/groupes", { titre: "Les gourmands", emoji: "🍕", invites: membres.map((m) => m.idPublic), idClient: randomUUID() });
  assert.equal(cree.statut, 201, JSON.stringify(cree.corps));
  const id = cree.corps.conversation.id as string;
  for (const m of membres) await m.demander("POST", `/app/conversations/${id}/reponse`, { rejoint: true });
  return { admin, membres, id };
}

test("sondage : 2 à 4 lieux publiés, chiffrés un par un dans leurs options, présentés avec leurs voix ; la notification ne cite aucun lieu", async () => {
  const { admin, membres, id } = await groupe(2);
  const lieux = [lieu("publie", "Pizzeria Bella"), lieu("publie", "Le Wok d'Or"), lieu()];
  banc.social.pushs.length = 0;
  const r = await lancer(admin, id, lieux, dans(30));
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  const message = r.corps.message;
  assert.deepEqual([message.type, message.texte, message.lieuId], ["vote", QUESTION_SONDAGE, null]);
  assert.deepEqual(message.vote, {
    finLe: dans(30), closLe: null, gagnant: null, monVote: null, votants: 0,
    options: lieux.map((lieuId, i) => ({ ordre: i + 1, lieuId, votes: 0 })),
  });
  const ligne = banc.tables.messages.get(Number(message.id))!;
  const options = [...banc.tables.optionsSondages.values()].filter((o) => o.messageId === ligne.id).sort((a, b) => a.ordre - b.ordre);
  assert.equal(options.length, 3);
  const chiffrement = banc.social.dependances.chiffrement!;
  for (const [i, o] of options.entries()) {
    assert.ok(/^v\d+:/.test(o.lieuChiffre) && !o.lieuChiffre.split(":").includes(String(lieux[i])), "jamais l'id du lieu en clair");
    assert.equal(dechiffrerLieuSondage(chiffrement, o.lieuChiffre, { conversationId: ligne.conversationId, idClient: ligne.idClient, ordre: o.ordre }), lieux[i]);
    assert.equal(dechiffrerLieuSondage(chiffrement, o.lieuChiffre, { conversationId: ligne.conversationId, idClient: ligne.idClient, ordre: o.ordre + 1 }), null, "déplacé d'une option à l'autre, il ne se relit plus");
  }
  await banc.attendreEnvois();
  assert.deepEqual(banc.social.pushs.map((p) => p.compteId).sort(), membres.map((m) => m.compteId).sort());
  assert.equal(banc.social.pushs[0]!.message.texte, "Léa a lancé un sondage.");
  const ecrit = JSON.stringify(banc.social.pushs);
  for (const interdit of ["Pizzeria", "Wok", ...lieux.map(String)]) assert.ok(!ecrit.includes(interdit), `rien de « ${interdit} » dans la notification`);
  const vu = (await lireFil(membres[0]!, id)).messages.find((m: { id: string }) => m.id === message.id);
  assert.deepEqual(vu.vote.options.map((o: { lieuId: number }) => o.lieuId), lieux, "un membre lit les lieux, déchiffrés");
  const rejoue = await lancer(admin, id, lieux, dans(30), ligne.idClient);
  assert.deepEqual([rejoue.statut, rejoue.corps.message.id], [200, message.id], "même idClient : le même sondage");
  assert.equal([...banc.tables.sondages.values()].filter((s) => s.messageId === ligne.id).length, 1);
});

test("sondage : groupes seulement, lieux publiés et différents, fin entre 10 min et 7 jours, refusé à un compte limité", async () => {
  const { admin, membres, id } = await groupe(1);
  const [a, b] = [lieu(), lieu()];
  const prive = (await admin.demander("POST", "/app/conversations/prive", { personne: membres[0]!.idPublic })).corps.conversation.id;
  assert.deepEqual([(await lancer(admin, prive, [a, b])).statut, (await lancer(admin, prive, [a, b])).corps.erreur], [409, "reserve-aux-groupes"]);
  const champ = async (lieux: unknown, finLe?: unknown) => (await lancer(admin, id, lieux, finLe)).corps.champ;
  assert.equal(await champ([a]), "lieux");
  assert.equal(await champ([a, b, lieu(), lieu(), lieu()]), "lieux");
  assert.equal(await champ([a, a]), "lieux");
  assert.equal(await champ([a, "b"]), "lieux");
  assert.equal(await champ("a,b"), "lieux");
  assert.equal(await champ([a, b], dans(9)), "finLe");
  assert.equal(await champ([a, b], dans(7 * 24 * 60 + 1)), "finLe");
  assert.equal(await champ([a, b], "demain"), "finLe");
  assert.equal((await lancer(admin, id, [a, b], dans(10))).statut, 201, "10 min tout juste");
  assert.equal((await lancer(admin, id, [a, b], dans(7 * 24 * 60))).statut, 201, "7 jours tout juste");
  const ferme = lieu("brouillon");
  assert.deepEqual([(await lancer(admin, id, [a, ferme])).statut, (await lancer(admin, id, [a, ferme])).corps.erreur], [404, "lieu-inconnu"]);
  const intrus = await banc.creerPersonne();
  assert.equal((await lancer(intrus, id, [a, b])).statut, 404);
  limites.set(admin.compteId, { jusqua: null, motif: "spam" });
  try {
    const r = await lancer(admin, id, [a, b]);
    assert.deepEqual([r.statut, r.corps.erreur], [403, "compte-limite"]);
  } finally {
    limites.delete(admin.compteId);
  }
});

test("voter : un vote par membre, qu'on change ou retire jusqu'à la fin ; la version monte ; ni les votants ni le lieu ne fuient", async () => {
  const { admin, membres, id } = await groupe(3);
  const lieux = [lieu(), lieu(), lieu()];
  const messageId = (await lancer(admin, id, lieux, dans(30))).corps.message.id as string;
  const version = (await lireFil(admin, id)).version;
  const r = await voter(membres[0]!, id, messageId, 2);
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.deepEqual([r.corps.message.vote.monVote, r.corps.message.vote.votants, r.corps.message.vote.options.map((o: { votes: number }) => o.votes)], [2, 1, [0, 1, 0]]);
  assert.equal(r.corps.version, version + 1);
  assert.equal((await voter(membres[0]!, id, messageId, 2)).corps.version, version + 1, "le même vote : rien ne change");
  const change = await voter(membres[0]!, id, messageId, 1);
  assert.deepEqual([change.corps.message.vote.options.map((o: { votes: number }) => o.votes), change.corps.version], [[1, 0, 0], version + 2]);
  await voter(membres[1]!, id, messageId, 1);
  const vuParAdmin = (await lireFil(admin, id)).messages.find((m: { id: string }) => m.id === messageId).vote;
  assert.deepEqual([vuParAdmin.monVote, vuParAdmin.votants, vuParAdmin.options[0].votes], [null, 2, 2]);
  assert.ok(!JSON.stringify(vuParAdmin).includes(membres[0]!.idPublic!), "qui a voté quoi ne sort jamais");
  const retire = await voter(membres[0]!, id, messageId);
  assert.deepEqual([retire.statut, retire.corps.message.vote.monVote, retire.corps.message.vote.votants], [200, null, 1]);
  const versionApres = retire.corps.version;
  assert.equal((await voter(membres[0]!, id, messageId)).corps.version, versionApres, "rien à retirer : la version ne bouge pas");
  for (const ordre of [0, 4, 5, "1", 1.5, null]) assert.equal((await voter(membres[0]!, id, messageId, ordre)).corps.champ, "ordre", String(ordre));
  const intrus = await banc.creerPersonne();
  assert.equal((await voter(intrus, id, messageId, 1)).statut, 404);
  const texte = (await admin.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "texte", texte: "On y va ?" })).corps.message.id;
  assert.deepEqual([(await voter(membres[0]!, id, texte, 1)).statut, (await voter(membres[0]!, id, texte, 1)).corps.erreur], [404, "message-inconnu"]);
  const nouveau = await banc.creerPersonne();
  banc.rendrePotes(admin, nouveau);
  await admin.demander("POST", `/app/conversations/${id}/invites`, { invites: [nouveau.idPublic] });
  await nouveau.demander("POST", `/app/conversations/${id}/reponse`, { rejoint: true });
  assert.equal((await voter(nouveau, id, messageId, 1)).statut, 404, "arrivé après le sondage : il ne le voit pas");
  limites.set(membres[2]!.compteId, { jusqua: null, motif: "spam" });
  try {
    assert.equal((await voter(membres[2]!, id, messageId, 1)).corps.erreur, "compte-limite");
    assert.equal((await voter(membres[2]!, id, messageId)).corps.erreur, "compte-limite");
  } finally {
    limites.delete(membres[2]!.compteId);
  }
  banc.horloge.maintenant += 30 * MINUTE;
  const tard = await voter(membres[2]!, id, messageId, 3);
  assert.deepEqual([tard.statut, tard.corps.erreur], [409, "sondage-clos"], "la fin est passée, même avant la tâche");
  assert.equal((await voter(membres[1]!, id, messageId)).corps.erreur, "sondage-clos");
});

test("supprimer le sondage pour tout le monde : options et votes partent avec lui", async () => {
  const { admin, membres, id } = await groupe(1);
  const messageId = (await lancer(admin, id, [lieu(), lieu()])).corps.message.id as string;
  await voter(membres[0]!, id, messageId, 1);
  assert.equal((await membres[0]!.demander("DELETE", `/app/conversations/${id}/messages/${messageId}`)).statut, 403);
  assert.equal((await admin.demander("DELETE", `/app/conversations/${id}/messages/${messageId}`)).statut, 200);
  const n = Number(messageId);
  assert.deepEqual([banc.tables.sondages.has(n), [...banc.tables.optionsSondages.values()].some((o) => o.messageId === n), banc.tables.votesSondages.some((v) => v.messageId === n)], [false, false, false]);
  const vu = (await lireFil(membres[0]!, id)).messages.find((m: { id: string }) => m.id === messageId);
  assert.deepEqual([vu.etat, vu.vote, vu.texte], ["supprime", undefined, null]);
  assert.equal((await voter(membres[0]!, id, messageId, 1)).statut, 404);
});

test("fin du sondage (tâche de la minute) : gagnant, message de SOS Miam chiffré, notification sans le lieu ; une seule fois", async () => {
  const { admin, membres, id } = await groupe(3);
  const lieux = [lieu("publie", "Pizzeria Bella"), lieu("publie", "Le Wok d'Or")];
  const messageId = (await lancer(admin, id, lieux, dans(15))).corps.message.id as string;
  await voter(membres[0]!, id, messageId, 2);
  await voter(membres[1]!, id, messageId, 2);
  await voter(admin, id, messageId, 1);
  await membres[2]!.demander("PUT", `/app/conversations/${id}/notifications`, { coupees: true });
  banc.horloge.maintenant += MINUTE;
  await passer();
  banc.horloge.maintenant -= MINUTE;
  assert.equal(banc.tables.sondages.get(Number(messageId))!.closLe, null, "pas encore fini");
  assert.equal((await passer()).sondages, 0);
  banc.horloge.maintenant += 15 * MINUTE;
  const [premier, second] = await Promise.all([passer(), passer()]);
  assert.equal(premier.sondages + second.sondages, 1, "deux passages en même temps : un seul le clôt");
  const effets = [...premier.effets, ...second.effets];
  const s = banc.tables.sondages.get(Number(messageId))!;
  assert.deepEqual([s.gagnant, s.closLe?.getTime()], [2, banc.horloge.maintenant]);
  const fil = await lireFil(membres[0]!, id);
  const systeme = fil.messages.at(-1);
  assert.deepEqual([systeme.systeme, systeme.auteur, systeme.texte], ["sondage-clos", null, "Le vote est fini : Le Wok d'Or gagne avec 2 voix sur 3."]);
  const brut = banc.tables.messages.get(Number(systeme.id))!;
  assert.ok(brut.texteChiffre && !brut.texteChiffre.includes("Wok"), "le message de SOS Miam est chiffré");
  const vote = fil.messages.find((m: { id: string }) => m.id === messageId).vote;
  assert.deepEqual([vote.gagnant, vote.closLe !== null], [2, true]);
  assert.deepEqual(effets.map((e) => (e.quoi === "push" ? e.compteId : 0)).sort(), [admin.compteId, membres[0]!.compteId, membres[1]!.compteId].sort(), "pas celui qui a coupé");
  for (const e of effets) {
    assert.ok(e.quoi === "push");
    assert.deepEqual(e.message, { titre: "🍝 Les gourmands", texte: "Le sondage est fini, va voir qui gagne !", lien: `/potes/discussion/${id}`, regroupement: `conversation:${id}` });
  }
  assert.ok(!JSON.stringify(effets).includes("Wok"));
  assert.deepEqual(await passer(), { sondages: 0, rappels: 0, echecs: 0, effets: [] }, "rien à refaire");
});

test("fin du sondage : égalité au premier proposé, personne n'a voté, un sondage masqué se clôt sans rien dire", async () => {
  const { admin, membres, id } = await groupe(2);
  const egalite = (await lancer(admin, id, [lieu("publie", "A"), lieu("publie", "B"), lieu("publie", "C")], dans(10))).corps.message.id as string;
  await voter(membres[0]!, id, egalite, 3);
  await voter(membres[1]!, id, egalite, 2);
  const vide = (await lancer(admin, id, [lieu(), lieu()], dans(10))).corps.message.id as string;
  const masque = (await lancer(admin, id, [lieu(), lieu()], dans(10))).corps.message.id as string;
  banc.tables.messages.get(Number(masque))!.suspenduLe = new Date(banc.horloge.maintenant);
  await passer();
  banc.horloge.maintenant += 10 * MINUTE;
  const bilan = await passer();
  assert.equal(bilan.sondages, 3);
  assert.deepEqual([egalite, vide, masque].map((m) => banc.tables.sondages.get(Number(m))!.gagnant), [2, null, null]);
  const textes = (await lireFil(admin, id)).messages.filter((m: { systeme?: string }) => m.systeme === "sondage-clos").map((m: { texte: string }) => m.texte);
  assert.deepEqual(textes, ["Le vote est fini : B gagne avec 1 voix sur 2.", "Le vote est fini, personne n'a voté."]);
  assert.equal(bilan.effets.length, 6, "deux annonces de trois membres");
});

test("export : tes sondages avec leurs lieux déchiffrés, et tes votes ; un signalement de sondage se lit comme un texte", async () => {
  const { admin, membres, id } = await groupe(1);
  const lieux = [lieu(), lieu()];
  const messageId = (await lancer(admin, id, lieux, dans(20))).corps.message.id as string;
  await voter(membres[0]!, id, messageId, 2);
  await voter(admin, id, messageId, 1);
  const moi = (await admin.demander("GET", "/app/social/export")).corps.export;
  const mien = moi.conversations.find((c: { id: string }) => c.id === id).messages.find((m: { type: string }) => m.type === "vote");
  assert.deepEqual(mien.sondage, { finLe: dans(20), closLe: null, gagnant: null, options: [{ ordre: 1, lieuId: lieux[0] }, { ordre: 2, lieuId: lieux[1] }] });
  assert.equal(mien.texte, QUESTION_SONDAGE);
  assert.deepEqual(moi.votesSondages.map((v: { messageId: string; ordre: number; lieuId: number }) => [v.messageId, v.ordre, v.lieuId]), [[messageId, 1, lieux[0]]]);
  const lui = (await membres[0]!.demander("GET", "/app/social/export")).corps.export;
  assert.deepEqual(lui.votesSondages.map((v: { conversationId: string; lieuId: number }) => [v.conversationId, v.lieuId]), [[id, lieux[1]]]);
  assert.ok(!lui.conversations.some((c: { messages: { type: string }[] }) => c.messages.some((m) => m.type === "vote")), "jamais le sondage d'un autre");
  const signale = await membres[0]!.demander("POST", "/app/signalements", { cible: "message", cibleId: messageId, raison: "haine", precision: null, explication: "" });
  assert.equal(signale.statut, 201, JSON.stringify(signale.corps));
  const s = [...banc.tables.signalements.values()].find((x) => x.cible === "message" && x.cibleId === messageId)!;
  const instantane = JSON.parse(banc.social.dependances.chiffrement!.dechiffrerInstantane(s.instantaneChiffre!, s.id));
  assert.deepEqual([instantane.type, instantane.texte, instantane.media, instantane.illisible], ["vote", QUESTION_SONDAGE, null, false]);
  assert.equal(s.fichierMedia, null);
});
