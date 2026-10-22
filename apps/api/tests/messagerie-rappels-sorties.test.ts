import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { TEXTE_RAPPEL_SORTIE } from "../src/services/messagerie-taches.ts";
import type { EffetSocial } from "../src/services/effets-sociaux-regles.ts";
import { passerTachesMessagerie, planifierTachesMessagerie } from "../src/taches/taches-messagerie.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

const MINUTE = 60_000;
let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

let dernierLieu = 700;
function lieu(): number {
  dernierLieu += 1;
  banc.tables.lieux.set(dernierLieu, { statut: "publie", nom: `Le Bouiboui n°${dernierLieu}` });
  return dernierLieu;
}
const iso = (minutes: number) => new Date(banc.horloge.maintenant + minutes * MINUTE).toISOString();
const passer = () => banc.social.dependances.messagerie.passerTaches(new Date(banc.horloge.maintenant));
const pushsDe = (effets: EffetSocial[]) => effets.flatMap((e) => (e.quoi === "push" ? [e] : []));

async function sortie(o: { quandMinutes: number; finVoteMinutes: number; invites: number; viennent: number }) {
  const organisateur = await banc.creerPersonne({ prenom: "Léa" });
  const potes: PersonneDeTest[] = [];
  for (let i = 0; i < o.invites; i++) {
    const pote = await banc.creerPersonne();
    banc.rendrePotes(organisateur, pote);
    potes.push(pote);
  }
  const cree = await organisateur.demander("POST", "/app/sorties", {
    titre: "Pizza du jeudi", emoji: "🍕", quand: iso(o.quandMinutes), finVote: iso(o.finVoteMinutes), invites: potes.map((p) => p.idPublic), lieux: [lieu()], idClient: randomUUID(),
  });
  assert.equal(cree.statut, 201, JSON.stringify(cree.corps));
  for (const p of potes.slice(0, o.viennent)) await p.demander("POST", `/app/sorties/${cree.corps.sortie.id}/reponse`, { vient: true });
  return { organisateur, potes, id: cree.corps.sortie.id as string, conversationId: cree.corps.sortie.conversationId as string };
}
const terminerVote = (s: { organisateur: PersonneDeTest; id: string }) => s.organisateur.demander("POST", `/app/sorties/${s.id}/terminer-vote`);

test("rappel de sortie : 1 h avant, une seule fois, message de SOS Miam dans la discussion et notification aux participants qui n'ont pas coupé", async () => {
  await passer();
  const s = await sortie({ quandMinutes: 3 * 60, finVoteMinutes: 60, invites: 3, viennent: 2 });
  await terminerVote(s);
  await s.potes[1]!.demander("PUT", `/app/conversations/${s.conversationId}/notifications`, { coupees: true });
  banc.horloge.maintenant += 119 * MINUTE;
  assert.equal((await passer()).rappels, 0, "61 min avant : trop tôt");
  banc.horloge.maintenant += MINUTE;
  const [premier, second] = await Promise.all([passer(), passer()]);
  assert.equal(premier.rappels + second.rappels, 1, "deux passages en même temps : un seul rappel");
  const sortieLue = banc.tables.sorties.get(Number(s.id))!;
  assert.equal(sortieLue.rappelEnvoyeLe?.getTime(), banc.horloge.maintenant);
  const fil = (await s.potes[0]!.demander("GET", `/app/conversations/${s.conversationId}`)).corps.fil;
  const message = fil.messages.at(-1);
  assert.deepEqual([message.systeme, message.auteur, message.texte], ["rappel-sortie", null, TEXTE_RAPPEL_SORTIE]);
  assert.equal(TEXTE_RAPPEL_SORTIE, "Rappel : c'est dans 1 h ! Bon appétit la bande.");
  const pushs = pushsDe([...premier.effets, ...second.effets]);
  assert.deepEqual(pushs.map((p) => p.compteId).sort(), [s.organisateur.compteId, s.potes[0]!.compteId].sort(), "ni celui qui a coupé, ni l'invité qui n'a pas répondu");
  for (const p of pushs) {
    assert.equal(p.sorte, "rappel-sortie");
    assert.deepEqual(p.message, { titre: "⏰ Pizza du jeudi", texte: "C'est dans 1 h !", lien: `/potes/sortie/${s.id}`, regroupement: `conversation:${s.conversationId}` });
  }
  banc.horloge.maintenant += 10 * MINUTE;
  assert.equal((await passer()).rappels, 0, "jamais deux fois");
});

test("rappel de sortie : rien sans lieu retenu, ni pour une sortie passée ; créée moins de 70 min avant, elle est notée sans rappel", async () => {
  await passer();
  const sansVote = await sortie({ quandMinutes: 2 * 60, finVoteMinutes: 2 * 60, invites: 1, viennent: 1 });
  const tardive = await sortie({ quandMinutes: 69, finVoteMinutes: 10, invites: 1, viennent: 1 });
  await terminerVote(tardive);
  const juste = await sortie({ quandMinutes: 70, finVoteMinutes: 10, invites: 1, viennent: 1 });
  await terminerVote(juste);
  banc.horloge.maintenant += 10 * MINUTE;
  const bilan = await passer();
  assert.equal(bilan.rappels, 2, "la tardive et la juste");
  assert.equal(banc.tables.sorties.get(Number(sansVote.id))!.rappelEnvoyeLe, null, "le vote court encore");
  assert.notEqual(banc.tables.sorties.get(Number(tardive.id))!.rappelEnvoyeLe, null, "notée pour ne plus être relue");
  const systemes = (conversationId: string) => [...banc.tables.messages.values()].filter((m) => m.conversationId === Number(conversationId) && m.systeme === "rappel-sortie").length;
  assert.deepEqual([systemes(tardive.conversationId), systemes(juste.conversationId)], [0, 1]);
  assert.deepEqual(pushsDe(bilan.effets).map((p) => p.compteId).sort(), [juste.organisateur.compteId, juste.potes[0]!.compteId].sort());
  const passee = await sortie({ quandMinutes: 90, finVoteMinutes: 10, invites: 1, viennent: 1 });
  await terminerVote(passee);
  banc.horloge.maintenant += 91 * MINUTE;
  assert.equal((await passer()).rappels, 0, "déjà commencée : trop tard");
  assert.equal(banc.tables.sorties.get(Number(passee.id))!.rappelEnvoyeLe, null);
});

test("tâche de la minute de la messagerie : un passage à la fois, une panne ne la fait pas tomber, le journal ne dit que des nombres", async (t) => {
  const appliques: EffetSocial[][] = [];
  const appliquer = async (effets: readonly EffetSocial[]) => void appliques.push([...effets]);
  const effet: EffetSocial = { quoi: "push", compteId: 3, message: { titre: "⏰ Secret", texte: "C'est dans 1 h !", lien: null }, sorte: "rappel-sortie" };
  const journal = t.mock.method(console, "log", () => {});
  assert.deepEqual(await passerTachesMessagerie({
    messagerie: { passerTaches: async () => ({ sondages: 1, rappels: 2, echecs: 0, effets: [effet] }) }, appliquer,
  }), { sondages: 1, rappels: 2, echecs: 0 });
  assert.deepEqual(appliques, [[effet]]);
  assert.deepEqual(journal.mock.calls.map((c) => c.arguments), [["Messagerie : 1 sondage(s) clos, 2 rappel(s) de sortie, 0 à reprendre."]]);
  const erreurs = t.mock.method(console, "error", () => {});
  assert.deepEqual(await passerTachesMessagerie({ messagerie: { passerTaches: async () => { throw new Error("base indisponible"); } }, appliquer }), { sondages: 0, rappels: 0, echecs: 0 });
  assert.equal(erreurs.mock.callCount(), 1);
  let appels = 0;
  let finir: () => void = () => {};
  const lent = { passerTaches: () => { appels += 1; return new Promise<{ sondages: number; rappels: number; echecs: number; effets: EffetSocial[] }>((r) => { finir = () => r({ sondages: 0, rappels: 0, echecs: 0, effets: [] }); }); } };
  const arreter = planifierTachesMessagerie({ messagerie: lent, appliquer, intervalleMs: 5 });
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(appels, 1, "le passage d'avant n'est pas fini : on attend");
  finir();
  await new Promise((r) => setTimeout(r, 30));
  arreter();
  assert.ok(appels >= 2);
});

test("Vu · il y a 2 min : l'heure de lecture avance avec luJusqua, montrée sous la même règle (les deux ont « Vu », sans blocage, jamais la sienne)", async () => {
  const a = await banc.creerPersonne();
  const b = await banc.creerPersonne();
  banc.rendrePotes(a, b);
  const id = (await a.demander("POST", "/app/conversations/prive", { personne: b.idPublic })).corps.conversation.id as string;
  const ecrire = async (texte: string) => (await a.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "texte", texte })).corps.message.id as string;
  const membreDe = async (lecteur: PersonneDeTest, qui: PersonneDeTest) =>
    (await lecteur.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === qui.idPublic);
  const premier = await ecrire("Tu viens ?");
  const lu = new Date(banc.horloge.maintenant + 2 * MINUTE);
  banc.horloge.maintenant = lu.getTime();
  await b.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: premier });
  assert.deepEqual(await membreDe(a, b), { personne: (await membreDe(a, b)).personne, role: "membre", depuis: (await membreDe(a, b)).depuis, luJusqua: premier, luLe: lu.toISOString() });
  assert.equal((await membreDe(b, b)).luLe, undefined, "jamais la sienne");
  banc.horloge.maintenant += 5 * MINUTE;
  await b.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: premier });
  assert.equal((await membreDe(a, b)).luLe, lu.toISOString(), "rien de neuf : l'heure ne bouge pas");
  const second = await ecrire("Alors ?");
  await b.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: second });
  assert.deepEqual([(await membreDe(a, b)).luJusqua, (await membreDe(a, b)).luLe], [second, new Date(banc.horloge.maintenant).toISOString()]);
  banc.tables.profils.get(a.compteId)!.accusesLecture = false;
  const coupe = await membreDe(a, b);
  assert.deepEqual([coupe.luJusqua, coupe.luLe], [undefined, undefined], "coupé chez moi : ni l'un ni l'autre");
  banc.tables.profils.get(a.compteId)!.accusesLecture = true;
  banc.tables.profils.get(b.compteId)!.accusesLecture = false;
  assert.equal((await membreDe(a, b)).luLe, undefined, "coupé chez lui : rien non plus");
  const ligne = banc.tables.membres.find((m) => m.conversationId === Number(id) && m.compteId === b.compteId)!;
  assert.ok(ligne.luLe instanceof Date, "gardée quand même, pour lui");
});
