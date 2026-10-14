// Tests des groupes de la messagerie : on n'y entre qu'en ACCEPTANT une invitation (réponse de Hugo du 14/10/2026), titre
// chiffré, invités de TA bande seulement, refus silencieux et noté, 30 jours après un départ volontaire, 20 personnes en tout,
// admins (404 avant 403), dernier admin qui part, dernier membre qui part, groupes seulement (privé et sortie), blocages dans
// les deux sens dans un groupe. Tout en mémoire, clé de test.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";
import { demanderBrut, trouverAdresseBanc } from "./outils/demander-brut.ts";

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

const JOUR = 24 * 60 * 60 * 1000;
const ids = (liste: { personne?: { id: string }; id?: string }[]) => liste.map((x) => x.personne?.id ?? x.id);

/** Un créateur et ses potes */
async function bande(nombre: number) {
  const createur = await banc.creerPersonne({ prenom: "Léa" });
  const potes: PersonneDeTest[] = [];
  for (let i = 0; i < nombre; i++) {
    const p = await banc.creerPersonne();
    banc.rendrePotes(createur, p);
    potes.push(p);
  }
  return { createur, potes };
}
const creerGroupe = (p: PersonneDeTest, invites: (string | null)[], titre = "Les gourmands", idClient = randomUUID()) =>
  p.demander("POST", "/app/conversations/groupes", { titre, emoji: "🍕", invites, idClient });
const repondre = (p: PersonneDeTest, id: string, rejoint: boolean) => p.demander("POST", `/app/conversations/${id}/reponse`, { rejoint });
const ecrire = (p: PersonneDeTest, id: string, texte: string) => p.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "texte", texte });

test("création : titre chiffré, tu es admin, chaque invité de ta bande reçoit une invitation ; même clé : rien de plus", async () => {
  const { createur, potes: [b, c] } = await bande(2);
  const inconnu = await banc.creerPersonne();
  const bloque = await banc.creerPersonne();
  banc.rendrePotes(createur, bloque);
  banc.bloquer(createur, bloque);
  const idClient = randomUUID();
  const cree = await creerGroupe(createur, [b!.idPublic, c!.idPublic, inconnu.idPublic, bloque.idPublic, "zzzzzzzzzz"], "Les gourmands", idClient);
  assert.equal(cree.statut, 201, JSON.stringify(cree.corps));
  const { conversation, ignores } = cree.corps;
  assert.deepEqual([conversation.type, conversation.titre, conversation.emoji, conversation.moi.role], ["groupe", "Les gourmands", "🍕", "admin"]);
  assert.deepEqual(ids(conversation.membres), [createur.idPublic]);
  assert.deepEqual(ids(conversation.invites), [b!.idPublic, c!.idPublic]);
  assert.deepEqual([...ignores].sort(), [inconnu.idPublic, bloque.idPublic, "zzzzzzzzzz"].sort());
  const ligne = banc.tables.conversations.get(Number(conversation.id))!;
  assert.ok(ligne.titreChiffre && !ligne.titreChiffre.includes("gourmands"), "titre chiffré en base");
  const cloche = () => [...banc.tables.cloche.values()].filter((n) => n.type === "invitation-groupe" && n.cibleId === conversation.id);
  assert.deepEqual(cloche().map((n) => n.compteId).sort(), [b!.compteId, c!.compteId].sort());
  const rejoue = await creerGroupe(createur, [b!.idPublic], "Autre titre", idClient);
  assert.deepEqual([rejoue.statut, rejoue.corps.conversation.id, rejoue.corps.conversation.titre], [200, conversation.id, "Les gourmands"]);
  assert.equal(cloche().length, 2, "personne n'est prévenu deux fois");
  // Par l'en-tête Idempotency-Key, comme l'app
  const adresse = await trouverAdresseBanc(banc);
  const cle = randomUUID();
  const parEntete = () => demanderBrut(adresse, createur.jeton, "POST", "/app/conversations/groupes", { json: { titre: "Par l'en-tête", emoji: "🌮", invites: [b!.idPublic] }, entetes: { "Idempotency-Key": cle } });
  const [premier, second] = [await parEntete(), await parEntete()];
  assert.deepEqual([premier.statut, second.statut], [201, 200]);
  assert.equal((second.corps as { conversation: { id: string } }).conversation.id, (premier.corps as { conversation: { id: string } }).conversation.id);
});

test("création refusée : champs, mot interdit, personne de ta bande", async () => {
  const { createur, potes: [b] } = await bande(1);
  const envoi = (corps: Record<string, unknown>) => createur.demander("POST", "/app/conversations/groupes", { titre: "Ok", emoji: "🍕", invites: [b!.idPublic], idClient: randomUUID(), ...corps });
  assert.equal((await envoi({ titre: "" })).corps.champ, "titre");
  assert.deepEqual((await envoi({ titre: "Les connards" })).corps, { ok: false, erreur: "message-refuse", champ: "titre" });
  assert.equal((await envoi({ emoji: "abc" })).corps.champ, "emoji");
  assert.equal((await envoi({ invites: [] })).corps.champ, "invites");
  assert.equal((await envoi({ idClient: "nope" })).corps.champ, "idClient");
  const inconnu = await banc.creerPersonne();
  assert.equal((await envoi({ invites: [inconnu.idPublic] })).corps.erreur, "pas-dans-la-bande");
});

test("invité : il ne voit que l'invitation ; oui, la suite sans l'historique ; non, en silence, et on ne le réinvite pas", async () => {
  const { createur, potes: [b, c] } = await bande(2);
  const id = (await creerGroupe(createur, [b!.idPublic, c!.idPublic])).corps.conversation.id as string;
  await ecrire(createur, id, "Avant ton arrivée");
  const liste = (await b!.demander("GET", "/app/conversations")).corps;
  assert.deepEqual(liste.invitations, [{ id, titre: "Les gourmands", emoji: "🍕", invitePar: liste.invitations[0].invitePar, membres: 1, date: liste.invitations[0].date }]);
  assert.equal(liste.invitations[0].invitePar.id, createur.idPublic);
  assert.ok(!liste.conversations.some((x: { id: string }) => x.id === id));
  assert.deepEqual(Object.keys((await b!.demander("GET", `/app/conversations/${id}`)).corps), ["ok", "invitation"]);
  assert.equal((await b!.demander("GET", "/app/social/pouls")).corps.pouls.messages.invitations, 1);
  assert.equal((await ecrire(b!, id, "Je force la porte")).statut, 404);
  const oui = await repondre(b!, id, true);
  assert.deepEqual([oui.statut, oui.corps.rejoint, oui.corps.conversation.moi.role], [200, true, "membre"]);
  assert.deepEqual((await b!.demander("GET", `/app/conversations/${id}`)).corps.fil.messages, [], "pas l'historique");
  await ecrire(createur, id, "Bienvenue !");
  assert.deepEqual((await b!.demander("GET", `/app/conversations/${id}`)).corps.fil.messages.map((m: { texte: string }) => m.texte), ["Bienvenue !"]);
  assert.deepEqual(ids((await createur.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.membres), [createur.idPublic, b!.idPublic]);
  // C refuse : en silence (il reste « invité » pour les membres), il ne voit plus rien et on ne peut pas le réinviter
  assert.deepEqual((await repondre(c!, id, false)).corps, { ok: true, rejoint: false });
  assert.equal((await c!.demander("GET", `/app/conversations/${id}`)).statut, 404);
  assert.deepEqual((await repondre(c!, id, true)).corps, { ok: false, erreur: "invitation-inconnue" });
  const fil = (await createur.demander("GET", `/app/conversations/${id}`)).corps.fil;
  assert.deepEqual(ids(fil.conversation.invites), [c!.idPublic]);
  const reinvite = await createur.demander("POST", `/app/conversations/${id}/invites`, { invites: [c!.idPublic] });
  assert.deepEqual([reinvite.statut, reinvite.corps.ignores], [200, [c!.idPublic]]);
  assert.equal(banc.tables.invitationsGroupes.find((i) => i.compteId === c!.compteId && String(i.conversationId) === id)?.statut, "refuse");
});

test("admins : 404 avant 403, titre, rôle, retrait sans prévenir ; départ volontaire : 30 jours sans réinvitation", async () => {
  const { createur, potes: [b, c] } = await bande(2);
  const id = (await creerGroupe(createur, [b!.idPublic, c!.idPublic])).corps.conversation.id as string;
  await repondre(b!, id, true);
  await repondre(c!, id, true);
  const intrus = await banc.creerPersonne();
  assert.equal((await intrus.demander("PATCH", `/app/conversations/${id}`, { titre: "Piraté" })).statut, 404);
  assert.equal((await b!.demander("PATCH", `/app/conversations/${id}`, { titre: "Piraté" })).corps.erreur, "reserve-aux-admins");
  const renomme = await createur.demander("PATCH", `/app/conversations/${id}`, { titre: "Les affamés", emoji: "🌮" });
  assert.deepEqual([renomme.corps.conversation.titre, renomme.corps.conversation.emoji], ["Les affamés", "🌮"]);
  const promu = await createur.demander("PUT", `/app/conversations/${id}/membres/${b!.idPublic}/role`, { role: "admin" });
  assert.equal(promu.corps.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === b!.idPublic).role, "admin");
  assert.equal((await createur.demander("PUT", `/app/conversations/${id}/membres/${intrus.idPublic}/role`, { role: "admin" })).corps.erreur, "personne-inconnue");
  // Retiré par un admin : pas un départ, on peut le réinviter tout de suite
  assert.equal((await b!.demander("DELETE", `/app/conversations/${id}/membres/${c!.idPublic}`)).statut, 200);
  assert.equal((await c!.demander("GET", `/app/conversations/${id}`)).statut, 404);
  assert.equal((await b!.demander("POST", `/app/conversations/${id}/invites`, { invites: [c!.idPublic] })).corps.erreur, "pas-dans-la-bande", "C n'est pas dans la bande de B");
  assert.deepEqual((await createur.demander("POST", `/app/conversations/${id}/invites`, { invites: [c!.idPublic] })).corps.ignores, []);
  await repondre(c!, id, true);
  // C part de lui-même : 30 jours sans réinvitation, puis c'est possible
  assert.equal((await c!.demander("DELETE", `/app/conversations/${id}/membres/moi`)).statut, 200);
  assert.deepEqual((await createur.demander("POST", `/app/conversations/${id}/invites`, { invites: [c!.idPublic] })).corps.ignores, [c!.idPublic]);
  banc.horloge.maintenant += 31 * JOUR;
  assert.deepEqual((await createur.demander("POST", `/app/conversations/${id}/invites`, { invites: [c!.idPublic] })).corps.ignores, []);
  assert.equal((await repondre(c!, id, true)).corps.rejoint, true);
  assert.ok(!banc.tables.departs.some((d) => d.compteId === c!.compteId && String(d.conversationId) === id), "départ oublié en revenant");
});

test("dernier admin parti : le plus ancien membre le devient ; plus personne : le groupe est effacé", async () => {
  const { createur, potes: [b, c] } = await bande(2);
  const id = (await creerGroupe(createur, [b!.idPublic, c!.idPublic])).corps.conversation.id as string;
  await repondre(b!, id, true);
  banc.horloge.maintenant += 1000;
  await repondre(c!, id, true);
  await createur.demander("DELETE", `/app/conversations/${id}/membres/moi`);
  const membres = (await c!.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.membres;
  assert.deepEqual(membres.map((m: { personne: { id: string }; role: string }) => [m.personne.id, m.role]), [[b!.idPublic, "admin"], [c!.idPublic, "membre"]]);
  await b!.demander("DELETE", `/app/conversations/${id}/membres/moi`);
  await c!.demander("DELETE", `/app/conversations/${id}/membres/moi`);
  assert.equal(banc.tables.conversations.has(Number(id)), false);
});

test("20 personnes au plus, invitations en attente comprises", async () => {
  const { createur, potes } = await bande(20);
  const cree = await creerGroupe(createur, potes.slice(0, 19).map((p) => p.idPublic));
  assert.equal(cree.statut, 201);
  assert.equal((await creerGroupe(createur, potes.map((p) => p.idPublic))).corps.champ, "invites", "19 invités au plus");
  const plein = await createur.demander("POST", `/app/conversations/${cree.corps.conversation.id}/invites`, { invites: [potes[19]!.idPublic] });
  assert.deepEqual(plein.corps, { ok: false, erreur: "groupe-plein" });
});

test("groupes seulement : un privé ne se renomme ni ne se quitte (404) ; la discussion d'une sortie passe par la sortie (409)", async () => {
  const { createur, potes: [b] } = await bande(1);
  const prive = (await createur.demander("POST", "/app/conversations/prive", { personne: b!.idPublic })).corps.conversation.id;
  assert.equal((await createur.demander("PATCH", `/app/conversations/${prive}`, { titre: "Nous" })).corps.erreur, "conversation-inconnue");
  assert.equal((await createur.demander("DELETE", `/app/conversations/${prive}/membres/moi`)).statut, 404);
  const maintenant = new Date(banc.horloge.maintenant);
  const conversationId = prendreId(banc.tables, "conversations");
  banc.tables.conversations.set(conversationId, {
    id: conversationId, type: "sortie", clePrive: null, titreChiffre: null, emoji: null, creeParId: createur.compteId, version: 0,
    dernierMessageLe: maintenant, modifieLe: maintenant, creeLe: maintenant,
  });
  for (const p of [createur, b!]) banc.tables.membres.push({ conversationId, compteId: p.compteId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: maintenant });
  const sortieId = prendreId(banc.tables, "sorties");
  banc.tables.sorties.set(sortieId, {
    id: sortieId, conversationId, organisateurId: createur.compteId, titre: "Pizza du jeudi", emoji: "🍕", quand: new Date(maintenant.getTime() + 2 * JOUR),
    finVote: new Date(maintenant.getTime() + JOUR), lieuChoisiId: null, voteTermineLe: null, version: 0, modifieLe: maintenant, creeLe: maintenant,
  });
  for (const [methode, chemin, corps] of [["PATCH", "", { titre: "x" }], ["POST", "/invites", { invites: [b!.idPublic] }], ["DELETE", "/membres/moi", undefined]] as const) {
    assert.equal((await createur.demander(methode, `/app/conversations/${conversationId}${chemin}`, corps)).corps.erreur, "geree-par-la-sortie");
  }
  banc.pushs.length = 0;
  await ecrire(createur, String(conversationId), "On vote ?");
  await banc.attendreEnvois();
  const fil = (await b!.demander("GET", `/app/conversations/${conversationId}`)).corps.fil;
  assert.deepEqual([fil.conversation.titre, fil.conversation.sortieId, fil.messages[0].texte], ["Pizza du jeudi", String(sortieId), "On vote ?"]);
  assert.deepEqual(banc.pushs.map((p) => [p.compteId, p.message.titre, p.message.lien]), [[b!.compteId, "🎉 Pizza du jeudi", `/potes/sortie/${sortieId}`]]);
  assert.ok(!(await b!.demander("GET", "/app/conversations")).corps.conversations.some((x: { id: string }) => x.id === String(conversationId)), "pas dans la liste");
});

test("blocage dans un groupe : messages et réactions de l'un cachés pour l'autre, dans les deux sens ; les membres restent nommés", async () => {
  const { createur, potes: [b, c] } = await bande(2);
  const id = (await creerGroupe(createur, [b!.idPublic, c!.idPublic])).corps.conversation.id as string;
  await repondre(b!, id, true);
  await repondre(c!, id, true);
  const deLea = (await ecrire(createur, id, "De Léa")).corps.message.id;
  await ecrire(b!, id, "De B");
  await ecrire(c!, id, "De C");
  await b!.demander("PUT", `/app/conversations/${id}/messages/${deLea}/reactions/coeur`);
  banc.bloquer(c!, b!);
  const textes = async (p: PersonneDeTest) => (await p.demander("GET", `/app/conversations/${id}`)).corps.fil.messages.map((m: { texte: string }) => m.texte);
  assert.deepEqual(await textes(b!), ["De Léa", "De B"]);
  assert.deepEqual(await textes(c!), ["De Léa", "De C"]);
  assert.deepEqual(await textes(createur), ["De Léa", "De B", "De C"]);
  const filC = (await c!.demander("GET", `/app/conversations/${id}`)).corps.fil;
  assert.deepEqual(filC.messages[0].reactions, {}, "la réaction de B est cachée pour C");
  assert.equal(filC.conversation.membres.length, 3);
  banc.pushs.length = 0;
  await ecrire(b!, id, "Coucou tout le monde");
  await banc.attendreEnvois();
  // C a bloqué B : seule Léa est prévenue, du titre du groupe et du prénom de B, jamais du texte
  assert.deepEqual(banc.pushs.map((p) => [p.compteId, p.message.titre]), [[createur.compteId, "💬 Les gourmands"]]);
  assert.match(banc.pushs[0]!.message.texte, /^Miami\d+ a écrit\.$/);
  assert.equal(banc.pushs[0]!.message.regroupement, `conversation:${id}`);
});

test("un membre qui a bloqué l'admin se promeut et s'exclut comme les autres ; hors du groupe, la réponse ne dit rien d'un blocage", async () => {
  const { createur, potes: [b, c] } = await bande(2);
  const id = (await creerGroupe(createur, [b!.idPublic, c!.idPublic])).corps.conversation.id as string;
  await repondre(b!, id, true);
  await repondre(c!, id, true);
  banc.bloquer(b!, createur);
  assert.deepEqual(ids((await createur.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.membres), [createur.idPublic, b!.idPublic, c!.idPublic], "B reste nommé");
  const promu = await createur.demander("PUT", `/app/conversations/${id}/membres/${b!.idPublic}/role`, { role: "admin" });
  assert.equal(promu.statut, 200, JSON.stringify(promu.corps));
  assert.equal(promu.corps.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === b!.idPublic).role, "admin");
  assert.deepEqual((await createur.demander("DELETE", `/app/conversations/${id}/membres/${b!.idPublic}`)).corps, { ok: true });
  assert.equal((await b!.demander("GET", `/app/conversations/${id}`)).statut, 404, "B n'est plus membre");
  assert.deepEqual(ids((await createur.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.membres), [createur.idPublic, c!.idPublic]);
  // Quelqu'un d'extérieur : même réponse, qu'il t'ait bloqué ou non
  const dehors = await banc.creerPersonne();
  const bloqueur = await banc.creerPersonne();
  banc.bloquer(bloqueur, createur);
  for (const p of [dehors, bloqueur]) {
    assert.deepEqual((await createur.demander("DELETE", `/app/conversations/${id}/membres/${p.idPublic}`)).corps, { ok: true });
    const role = await createur.demander("PUT", `/app/conversations/${id}/membres/${p.idPublic}/role`, { role: "admin" });
    assert.deepEqual([role.statut, role.corps], [404, { ok: false, erreur: "personne-inconnue" }]);
  }
});

test("règle d'accès (B.0) : un message d'avant ton arrivée, ou de quelqu'un avec qui il y a un blocage, n'existe pas pour toi", async () => {
  const { createur, potes: [b, c] } = await bande(2);
  const id = (await creerGroupe(createur, [b!.idPublic, c!.idPublic])).corps.conversation.id as string;
  await repondre(c!, id, true);
  const avant = (await ecrire(createur, id, "Avant ton arrivée")).corps.message.id as string;
  await repondre(b!, id, true);
  const surAvant = [["PUT", "/reactions/coeur"], ["DELETE", "/reactions/coeur"], ["DELETE", ""]] as const;
  for (const [methode, suite] of surAvant) {
    const r = await b!.demander(methode, `/app/conversations/${id}/messages/${avant}${suite}`);
    assert.deepEqual([r.statut, r.corps], [404, { ok: false, erreur: "message-inconnu" }], `${methode} …${suite} (jamais 403 reserve-a-l-auteur)`);
  }
  assert.equal((await c!.demander("PUT", `/app/conversations/${id}/messages/${avant}/reactions/coeur`)).statut, 200, "C était déjà là");
  // C bloque B : chacun ne voit plus les messages de l'autre, ni ne peut y réagir ; les non-lus ne les comptent pas
  const deC = (await ecrire(c!, id, "De C")).corps.message.id as string;
  banc.bloquer(c!, b!);
  const deB = (await ecrire(b!, id, "De B")).corps.message.id as string;
  assert.equal((await b!.demander("PUT", `/app/conversations/${id}/messages/${deC}/reactions/coeur`)).corps.erreur, "message-inconnu", "C a bloqué B");
  assert.equal((await c!.demander("PUT", `/app/conversations/${id}/messages/${deB}/reactions/coeur`)).corps.erreur, "message-inconnu", "dans l'autre sens aussi");
  assert.equal((await createur.demander("PUT", `/app/conversations/${id}/messages/${deB}/reactions/coeur`)).statut, 200);
  const nonLus = async (p: PersonneDeTest) => (await p.demander("GET", "/app/conversations")).corps.conversations.find((x: { id: string }) => x.id === id).nonLus;
  assert.equal(await nonLus(c!), 1, "seulement le message de Léa (ni le sien, ni celui de B)");
  assert.equal(await nonLus(createur), 2, "Léa compte ceux de B et de C");
});

test("invitation à un groupe : elle sonne aussi sur le téléphone (décision de Hugo du 14/10), sans jamais un texte de message", async () => {
  const { createur, potes: [b, c] } = await bande(2);
  banc.pushs.length = 0;
  const cree = await creerGroupe(createur, [b!.idPublic], "Brunch du dimanche");
  assert.equal(cree.statut, 201, JSON.stringify(cree.corps));
  await banc.attendreEnvois();
  const pourB = banc.pushs.filter((p) => p.compteId === b!.compteId);
  assert.equal(pourB.length, 1, "une notification pour l'invité");
  assert.equal(pourB[0]!.message.titre, "💬 Léa t'invite dans un groupe");
  assert.match(pourB[0]!.message.texte, /Brunch du dimanche/);
  assert.equal(pourB[0]!.message.lien, "/potes/messages");
  assert.ok(banc.pushs.every((p) => p.compteId !== createur.compteId), "jamais à soi-même");
  // Inviter plus tard : le titre est relu (chiffré en base) ; un déjà-invité ne resonne pas
  banc.pushs.length = 0;
  const id = cree.corps.conversation.id as string;
  assert.equal((await createur.demander("POST", `/app/conversations/${id}/invites`, { invites: [b!.idPublic, c!.idPublic] })).statut, 200);
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs.map((p) => p.compteId), [c!.compteId]);
  assert.match(banc.pushs[0]!.message.texte, /Brunch du dimanche/);
});
