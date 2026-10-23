import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import type { MessageApi } from "../../../packages/commun/src/types/messagerie.ts";
import { adapterMessageAncienneApp } from "../src/fonctions/social/adapter-message-ancienne-app.ts";
import { estAncienneApp } from "../src/fonctions/social/est-ancienne-app.ts";
import { creerMemoireLimitee, type ClientGif } from "../src/services/giphy.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

const fauxGif: ClientGif = {
  tendances: async () => [],
  chercher: async () => [],
  lire: async (id) => ({ id, url: `https://media2.giphy.com/media/${id}/200w_d.webp`, largeur: 200, hauteur: 150 }),
};

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial({ gif: fauxGif });
});
after(() => banc.fermer());

const dans = (minutes: number) => new Date(banc.horloge.maintenant + minutes * 60_000).toISOString();
const ecrire = async (p: PersonneDeTest, id: string, texte: string) =>
  (await p.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "texte", texte })).corps.message as MessageApi;
const poserSysteme = async (id: string, texte: string, code = "sondage-clos") => {
  const pose = await banc.social.dependances.messagerie.poserMessageSysteme(Number(id), code, texte, new Date(banc.horloge.maintenant));
  assert.ok(pose);
  return String(pose.messageId);
};
const lireConversation = async (p: PersonneDeTest, id: string, ancienne: boolean) => {
  const r = ancienne ? await p.demanderAncienne("GET", "/app/conversations") : await p.demander("GET", "/app/conversations");
  return (r.corps.conversations as { id: string; nonLus: number; dernierMessage: MessageApi | null }[]).find((c) => c.id === id)!;
};

async function groupe(pseudo?: string) {
  const lea = await banc.creerPersonne({ prenom: "Léa" });
  const moi = await banc.creerPersonne({ prenom: "Hugo", ...(pseudo ? { pseudo } : {}) });
  banc.rendrePotes(lea, moi);
  const cree = await lea.demander("POST", "/app/conversations/groupes", { titre: "Les gourmands", emoji: "🍕", invites: [moi.idPublic], idClient: randomUUID() });
  assert.equal(cree.statut, 201, JSON.stringify(cree.corps));
  const id = cree.corps.conversation.id as string;
  assert.equal((await moi.demander("POST", `/app/conversations/${id}/reponse`, { rejoint: true })).statut, 200);
  return { lea, moi, id };
}

test("estAncienneApp : sans en-tête, mal écrit ou avant la 1.0.2 : ancienne ; 1.0.2 et après : non", () => {
  for (const v of [undefined, null, "", "abc", "1.0", "1.0.1", "0.9.9", " 1.0.1 ", 102]) assert.equal(estAncienneApp(v), true, String(v));
  for (const v of ["1.0.2", "1.0.10", "1.1.0", "2.0.0", " 1.0.2 "]) assert.equal(estAncienneApp(v), false, v);
});

test("adapterMessageAncienneApp : un GIF ou un sondage devient un petit texte (rien s'il n'est plus visible) ; le reste ne change pas", () => {
  const base: MessageApi = {
    id: "7", idClient: randomUUID(), auteur: null, date: "2026-10-23T10:00:00.000Z", type: "texte", texte: "Coucou", lieuId: null, media: null, reactions: {}, etat: "visible",
  };
  assert.equal(adapterMessageAncienneApp(base), base);
  const gif = adapterMessageAncienneApp({ ...base, type: "gif", texte: null, gif: { id: "chatDrole1", url: "https://media2.giphy.com/x.webp", largeur: 200, hauteur: 150 } });
  assert.deepEqual([gif.type, gif.texte, "gif" in gif], ["texte", "🎞️ Un GIF t'attend : mets l'app à jour pour le voir.", false]);
  const vote = adapterMessageAncienneApp({ ...base, type: "vote", texte: "On mange où ?", vote: { finLe: base.date, closLe: null, gagnant: null, options: [], monVote: null, votants: 0 } });
  assert.deepEqual([vote.type, vote.texte, "vote" in vote], ["texte", "🍝 On mange où ? Mets l'app à jour pour voter.", false]);
  assert.equal(adapterMessageAncienneApp({ ...base, type: "gif", texte: null, etat: "supprime" }).texte, null);
  const clos = adapterMessageAncienneApp({ ...base, type: "vote", texte: "On mange où ?", vote: { finLe: base.date, closLe: base.date, gagnant: 1, options: [], monVote: null, votants: 2 } });
  assert.equal(clos.texte, "🍝 Le vote est fini : mets l'app à jour pour voir qui gagne.", "clos : comme la notification de fin");
});

test("app d'avant la 1.0.2 : ni message de SOS Miam, ni GIF, ni sondage tels quels ; la 1.0.2 voit tout", async () => {
  const { lea, moi, id } = await groupe();
  const texte = await ecrire(lea, id, "On se fait une pizza ?");
  const gif = (await lea.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "gif", gifId: "chatDrole1" })).corps.message as MessageApi;
  banc.tables.lieux.set(7001, { statut: "publie", nom: "Pizzeria Bella" });
  banc.tables.lieux.set(7002, { statut: "publie", nom: "Le Wok d'Or" });
  const vote = await lea.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "vote", lieux: [7001, 7002], finLe: dans(30) });
  assert.equal(vote.statut, 201, JSON.stringify(vote.corps));
  const systeme = await poserSysteme(id, "🏁 Le sondage est clos.");

  const neuve = (await moi.demander("GET", `/app/conversations/${id}`)).corps.fil.messages as MessageApi[];
  assert.deepEqual(neuve.map((m) => [m.type, m.systeme ?? null]), [["texte", null], ["gif", null], ["vote", null], ["texte", "sondage-clos"]]);
  const ancienne = (await moi.demanderAncienne("GET", `/app/conversations/${id}`)).corps.fil.messages as MessageApi[];
  assert.deepEqual(ancienne.map((m) => [m.id, m.type, m.texte]), [
    [texte.id, "texte", "On se fait une pizza ?"],
    [gif.id, "texte", "🎞️ Un GIF t'attend : mets l'app à jour pour le voir."],
    [vote.corps.message.id, "texte", "🍝 On mange où ? Mets l'app à jour pour voter."],
  ]);
  assert.ok(ancienne.every((m) => !("gif" in m) && !("vote" in m) && !("systeme" in m)));

  assert.equal((await lireConversation(moi, id, false)).dernierMessage?.id, systeme);
  const vueAncienne = await lireConversation(moi, id, true);
  assert.deepEqual([vueAncienne.dernierMessage?.id, vueAncienne.dernierMessage?.type], [vote.corps.message.id, "texte"], "l'aperçu de la liste n'est jamais un message de SOS Miam");
});

test("app d'avant la 1.0.2 : lire jusqu'à son dernier message couvre les messages de SOS Miam qui le suivent, jamais un message d'un pote", async () => {
  const { lea, moi, id } = await groupe();
  const premier = await ecrire(lea, id, "Tu viens ce soir ?");
  await poserSysteme(id, "🏁 Le sondage est clos.");
  assert.deepEqual([(await lireConversation(moi, id, true)).nonLus, (await lireConversation(moi, id, false)).nonLus], [1, 2], "l'ancienne app ne compte que ce qu'elle voit");
  assert.equal((await moi.demanderAncienne("PUT", `/app/conversations/${id}/lu`, { jusqua: premier.id })).statut, 200);
  assert.equal((await lireConversation(moi, id, true)).nonLus, 0, "la pastille de la discussion s'efface");
  assert.equal((await lireConversation(moi, id, false)).nonLus, 0);

  const deuxieme = await ecrire(lea, id, "Allez !");
  await poserSysteme(id, "🏁 Encore un sondage clos.");
  const troisieme = await ecrire(lea, id, "Réponds 😄");
  await poserSysteme(id, "🏁 Et un dernier.");
  await moi.demanderAncienne("PUT", `/app/conversations/${id}/lu`, { jusqua: deuxieme.id });
  assert.deepEqual([(await lireConversation(moi, id, true)).nonLus, (await lireConversation(moi, id, false)).nonLus], [1, 2], "s'arrête au message suivant d'un pote (et compte ce qui reste)");
  await moi.demanderAncienne("PUT", `/app/conversations/${id}/lu`, { jusqua: troisieme.id });
  assert.equal((await lireConversation(moi, id, true)).nonLus, 0);

  const ligne = banc.tables.membres.find((m) => m.conversationId === Number(id) && m.compteId === moi.compteId)!;
  assert.equal(ligne.luLe, null, "jamais l'heure de lecture d'une app qui ne connaît pas le « Vu »");
  const vuParLea = (await lea.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === moi.idPublic);
  assert.equal(vuParLea.luJusqua, undefined, "aucun « Vu » pour une lecture faite depuis la 1.0.1");

  const quatrieme = await ecrire(lea, id, "Tu as mis l'app à jour ?");
  await moi.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: quatrieme.id });
  const apres = (await lea.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === moi.idPublic);
  assert.deepEqual([apres.luJusqua, typeof apres.luLe], [quatrieme.id, "string"], "depuis la 1.0.2, le « Vu » revient");
});

test("« Vu » : une ancienne position de lecture, gardée sans heure, n'est jamais montrée", async () => {
  const { lea, moi, id } = await groupe();
  const message = await ecrire(lea, id, "Coucou");
  const ligne = banc.tables.membres.find((m) => m.conversationId === Number(id) && m.compteId === moi.compteId)!;
  Object.assign(ligne, { luJusqua: Number(message.id), luLe: null });
  const membre = (await lea.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === moi.idPublic);
  assert.equal(membre.luJusqua, undefined);
});

test("cloche d'une app d'avant la 1.0.2 : sans les mentions d'une discussion (elle les dirait « dans un commentaire »)", async () => {
  const { lea, moi, id } = await groupe("hugo.miam");
  await ecrire(lea, id, "@hugo.miam tu viens ?");
  const neuve = (await moi.demander("GET", "/app/cloche")).corps.cloche.notifications as { type: string; cible: { type: string } | null }[];
  assert.ok(neuve.some((n) => n.type === "mention" && n.cible?.type === "conversation"));
  const ancienne = (await moi.demanderAncienne("GET", "/app/cloche")).corps.cloche.notifications as { type: string; cible: { type: string } | null }[];
  assert.ok(!ancienne.some((n) => n.type === "mention" && n.cible?.type === "conversation"));
  assert.equal(ancienne.length, neuve.length - 1, "le reste de la cloche ne change pas");
  const nonVues = async (p: Promise<{ corps: { pouls: { cloche: { nonVues: number } } } }>) => (await p).corps.pouls.cloche.nonVues;
  assert.equal(await nonVues(moi.demanderAncienne("GET", "/app/social/pouls")), (await nonVues(moi.demander("GET", "/app/social/pouls"))) - 1, "et son compteur ne la compte pas");
});

test("app d'avant la 1.0.2 : une discussion qui n'a que des messages de SOS Miam ne compte aucun non-lu (liste, pouls) ; la 1.0.2 les compte", async () => {
  const { moi, id } = await groupe();
  await poserSysteme(id, "🏁 Le sondage est clos.");
  const pouls = async (ancienne: boolean) => (ancienne ? await moi.demanderAncienne("GET", "/app/social/pouls") : await moi.demander("GET", "/app/social/pouls")).corps.pouls;
  assert.deepEqual([(await lireConversation(moi, id, true)).nonLus, (await pouls(true)).messages.nonLus], [0, 0]);
  assert.deepEqual([(await lireConversation(moi, id, false)).nonLus, (await pouls(false)).messages.nonLus], [1, 1]);
});

test("app d'avant la 1.0.2 : le rappel d'une sortie où personne n'a écrit ne laisse pas de pastille qui ne s'efface jamais", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa" });
  const moi = await banc.creerPersonne({ prenom: "Hugo" });
  banc.rendrePotes(lea, moi);
  banc.tables.lieux.set(7101, { statut: "publie", nom: "Chez Nonna Lia" });
  const creee = await lea.demander("POST", "/app/sorties", {
    titre: "Pizza du jeudi", emoji: "🍕", quand: dans(3 * 60), finVote: dans(60), invites: [moi.idPublic], lieux: [7101], idClient: randomUUID(),
  });
  assert.equal(creee.statut, 201, JSON.stringify(creee.corps));
  const sortie = creee.corps.sortie as { id: string; conversationId: string };
  assert.equal((await moi.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true })).statut, 200);
  await poserSysteme(sortie.conversationId, "⏰ C'est dans 1 h !", "rappel-sortie");
  const nonLus = async (ancienne: boolean) => {
    const liste = ancienne ? await moi.demanderAncienne("GET", "/app/sorties") : await moi.demander("GET", "/app/sorties");
    const une = ancienne ? await moi.demanderAncienne("GET", `/app/sorties/${sortie.id}`) : await moi.demander("GET", `/app/sorties/${sortie.id}`);
    const pouls = ancienne ? await moi.demanderAncienne("GET", "/app/social/pouls") : await moi.demander("GET", "/app/social/pouls");
    return [liste.corps.sorties.find((x: { id: string }) => x.id === sortie.id).nonLus, une.corps.sortie.nonLus, pouls.corps.pouls.sorties.nonLus];
  };
  assert.deepEqual(await nonLus(true), [0, 0, 0]);
  assert.deepEqual(await nonLus(false), [1, 1, 1]);
});

test("app d'avant la 1.0.2 : les réponses des gestes sur une conversation (ouvrir un privé…) adaptent aussi leur dernier message", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa" });
  const moi = await banc.creerPersonne({ prenom: "Hugo" });
  banc.rendrePotes(lea, moi);
  const prive = (await lea.demander("POST", "/app/conversations/prive", { personne: moi.idPublic })).corps.conversation.id as string;
  await lea.demander("POST", `/app/conversations/${prive}/messages`, { idClient: randomUUID(), type: "gif", gifId: "chatDrole2" });
  const ancienne = (await moi.demanderAncienne("POST", "/app/conversations/prive", { personne: lea.idPublic })).corps.conversation.dernierMessage as MessageApi;
  assert.deepEqual([ancienne.type, ancienne.texte, "gif" in ancienne], ["texte", "🎞️ Un GIF t'attend : mets l'app à jour pour le voir.", false]);
  const neuve = (await moi.demander("POST", "/app/conversations/prive", { personne: lea.idPublic })).corps.conversation.dernierMessage as MessageApi;
  assert.equal(neuve.type, "gif");
});

test("« Effacer pour moi » efface l'heure de lecture, même quand tout était déjà lu", async () => {
  const { lea, moi, id } = await groupe();
  const message = await ecrire(lea, id, "Coucou");
  await moi.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: message.id });
  const avant = (await lea.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === moi.idPublic);
  assert.equal(avant.luJusqua, message.id);
  const versionAvant = (await lea.demander("GET", `/app/conversations/${id}`)).corps.fil.version as number;
  assert.equal((await moi.demander("POST", `/app/conversations/${id}/effacer`)).statut, 200);
  const filApres = (await lea.demander("GET", `/app/conversations/${id}`)).corps.fil;
  const apres = filApres.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === moi.idPublic);
  assert.equal(apres.luJusqua, undefined);
  assert.ok(filApres.version > versionAvant, "les autres membres relisent la discussion : le « Vu » part tout de suite");
  assert.equal(banc.tables.membres.find((m) => m.conversationId === Number(id) && m.compteId === moi.compteId)!.luLe, null);
});

test("app d'avant la 1.0.2 : un groupe effacé pour soi ne revient pas, vide, pour un message de SOS Miam", async () => {
  const { lea, moi, id } = await groupe();
  banc.horloge.maintenant += 60_000;
  await ecrire(lea, id, "Coucou");
  assert.equal((await moi.demanderAncienne("POST", `/app/conversations/${id}/effacer`)).statut, 200);
  const ids = async (ancienne: boolean) =>
    ((ancienne ? await moi.demanderAncienne("GET", "/app/conversations") : await moi.demander("GET", "/app/conversations")).corps.conversations as { id: string }[]).map((c) => c.id);
  assert.deepEqual([(await ids(true)).includes(id), (await ids(false)).includes(id)], [false, false], "effacé pour les deux");
  await poserSysteme(id, "🏁 Le sondage est clos.");
  assert.equal((await ids(true)).includes(id), false, "la 1.0.1 ne voit rien de neuf : le groupe reste effacé");
  assert.equal((await ids(false)).includes(id), true, "la 1.0.2 voit le message de SOS Miam");
});

test("« Effacer pour moi » ne laisse jamais un « Vu » sur des messages qui n'ont pas été lus", async () => {
  const { lea, moi, id } = await groupe();
  const premier = await ecrire(lea, id, "Coucou");
  await moi.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: premier.id });
  banc.horloge.maintenant += 60 * 60_000;
  await ecrire(lea, id, "Tu es là ?");
  assert.equal((await moi.demander("POST", `/app/conversations/${id}/effacer`)).statut, 200);
  const vu = (await lea.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === moi.idPublic);
  assert.equal(vu.luJusqua, undefined);
  const ligne = banc.tables.membres.find((m) => m.conversationId === Number(id) && m.compteId === moi.compteId)!;
  assert.equal(ligne.luLe, null);
});

test("mémoire GIPHY : une entrée ne survit pas à ses 10 minutes (oubliée à l'accès suivant ou au balayage)", () => {
  let maintenant = 0;
  const memoire = creerMemoireLimitee<string>(10, 10 * 60_000, () => maintenant);
  memoire.ecrire("a", "1");
  maintenant += 60_000;
  memoire.ecrire("b", "2");
  maintenant += 9 * 60_000;
  memoire.oublierPerimees();
  assert.equal(memoire.taille(), 1, "a, écrite il y a 10 min, est partie au balayage");
  maintenant += 60_000;
  assert.equal(memoire.lire("c"), undefined);
  assert.equal(memoire.taille(), 0, "b part dès l'accès suivant");
});
