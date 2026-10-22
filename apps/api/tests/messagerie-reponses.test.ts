import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
  banc.tables.lieux.set(41, { statut: "publie", nom: "Chez le Capitaine" });
});
after(() => banc.fermer());

const MINUTE = 60_000;

async function deuxPotes() {
  const a = await banc.creerPersonne({ prenom: "Léa" });
  const b = await banc.creerPersonne({ prenom: "Malo" });
  banc.rendrePotes(a, b);
  const id = (await a.demander("POST", "/app/conversations/prive", { personne: b.idPublic })).corps.conversation.id as string;
  return { a, b, id };
}
const ecrire = (p: PersonneDeTest, id: string, texte: string, enPlus: Record<string, unknown> = {}, idClient = randomUUID()) =>
  p.demander("POST", `/app/conversations/${id}/messages`, { idClient, type: "texte", texte, ...enPlus });
const lireFil = async (p: PersonneDeTest, id: string) => (await p.demander("GET", `/app/conversations/${id}`)).corps.fil;
const messageDuFil = async (p: PersonneDeTest, id: string, messageId: string) => (await lireFil(p, id)).messages.find((m: { id: string }) => m.id === messageId);

test("répondre : le message cité est de la même conversation, visible, ni supprimé ni de SOS Miam ; son extrait (120) et son état", async () => {
  const { a, b, id } = await deuxPotes();
  const long = `${"🍕".repeat(130)} fin`;
  const cite = (await ecrire(a, id, long)).corps.message;
  const reponse = await ecrire(b, id, "Grave !", { reponseA: cite.id });
  assert.equal(reponse.statut, 201, JSON.stringify(reponse.corps));
  const { reponseA } = reponse.corps.message;
  assert.deepEqual([reponseA.id, reponseA.auteurId, reponseA.type, reponseA.etat], [cite.id, a.idPublic, "texte", "visible"]);
  assert.equal([...reponseA.extrait].length, 120);
  assert.equal(reponseA.extrait, "🍕".repeat(120));
  assert.equal(banc.tables.messages.get(Number(reponse.corps.message.id))!.reponseAId, Number(cite.id));

  const lieu = (await a.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "lieu", lieuId: 41, texte: "Le meilleur kebab" })).corps.message;
  assert.deepEqual((await ecrire(b, id, "J'y vais", { reponseA: lieu.id })).corps.message.reponseA, { id: lieu.id, auteurId: a.idPublic, type: "lieu", extrait: "Le meilleur kebab", etat: "visible" });

  const autre = await deuxPotes();
  const ailleurs = (await ecrire(autre.a, autre.id, "Ailleurs")).corps.message;
  for (const reponseA of [ailleurs.id, "999999"]) assert.deepEqual((await ecrire(b, id, "Hein ?", { reponseA })).corps, { ok: false, erreur: "reponse-introuvable" }, reponseA);
  for (const reponseA of ["0", 12, "abc"]) assert.deepEqual((await ecrire(b, id, "Hein ?", { reponseA })).corps, { ok: false, erreur: "champ-invalide", champ: "reponseA" });

  const idClient = randomUUID();
  const premier = await ecrire(b, id, "Je réponds", { reponseA: cite.id }, idClient);
  assert.equal(premier.statut, 201);
  assert.equal((await a.demander("DELETE", `/app/conversations/${id}/messages/${cite.id}`)).statut, 200);
  const rejoue = await ecrire(b, id, "Je réponds", { reponseA: cite.id }, idClient);
  assert.deepEqual([rejoue.statut, rejoue.corps.message.id], [200, premier.corps.message.id], "rejoué : le même, même si le message cité est parti depuis");
  assert.deepEqual([rejoue.corps.message.reponseA.etat, rejoue.corps.message.reponseA.extrait], ["supprime", null]);
  assert.equal((await ecrire(b, id, "Trop tard", { reponseA: cite.id })).corps.erreur, "reponse-introuvable", "un message supprimé ne se cite plus");

  banc.tables.messages.get(Number(lieu.id))!.suspenduLe = new Date(banc.horloge.maintenant);
  const vu = await messageDuFil(a, id, (await ecrire(b, id, "Vu ?", {})).corps.message.id);
  assert.equal(vu.reponseA, undefined);
  const surLieu = (await lireFil(a, id)).messages.filter((m: { reponseA?: { id: string } }) => m.reponseA?.id === lieu.id);
  assert.deepEqual(surLieu.map((m: { reponseA: { etat: string; extrait: unknown } }) => [m.reponseA.etat, m.reponseA.extrait]), [["masque", null]]);
  banc.tables.messages.delete(Number(lieu.id));
  assert.equal((await messageDuFil(a, id, surLieu[0].id)).reponseA, undefined, "la ligne citée n'existe plus : pas de citation");
});

test("répondre dans un groupe : un message d'avant ton arrivée, ou d'une personne bloquée, est cité « masque » sans auteur", async () => {
  const createur = await banc.creerPersonne({ prenom: "Léa" });
  const [b, c] = [await banc.creerPersonne(), await banc.creerPersonne()];
  banc.rendrePotes(createur, b);
  banc.rendrePotes(createur, c);
  const groupe = (await createur.demander("POST", "/app/conversations/groupes", { titre: "Les gourmands", emoji: "🍕", invites: [b.idPublic, c.idPublic], idClient: randomUUID() })).corps.conversation;
  await b.demander("POST", `/app/conversations/${groupe.id}/reponse`, { rejoint: true });
  const ancien = (await ecrire(b, groupe.id, "Avant l'arrivée de c")).corps.message;
  await c.demander("POST", `/app/conversations/${groupe.id}/reponse`, { rejoint: true });
  const reponse = (await ecrire(createur, groupe.id, "Je réponds à b", { reponseA: ancien.id })).corps.message;
  assert.equal(reponse.reponseA.etat, "visible");
  const vuParC = await messageDuFil(c, groupe.id, reponse.id);
  assert.deepEqual(vuParC.reponseA, { id: ancien.id, auteurId: null, type: "texte", extrait: null, etat: "masque" });
  assert.equal((await ecrire(c, groupe.id, "Moi aussi", { reponseA: ancien.id })).corps.erreur, "reponse-introuvable", "on ne cite que ce qu'on voit");
  const recent = (await ecrire(b, groupe.id, "Après")).corps.message;
  const aRecent = (await ecrire(createur, groupe.id, "Ok", { reponseA: recent.id })).corps.message;
  banc.bloquer(c, b);
  assert.deepEqual((await messageDuFil(c, groupe.id, aRecent.id)).reponseA, { id: recent.id, auteurId: null, type: "texte", extrait: null, etat: "masque" });
});

test("modifier son texte : 15 min, rechiffré avec le même contexte, version + 1, sans notification ; les refus", async () => {
  const { a, b, id } = await deuxPotes();
  const envoi = (await ecrire(a, id, "On mange où ?")).corps;
  const ligne = banc.tables.messages.get(Number(envoi.message.id))!;
  const avant = ligne.texteChiffre;
  banc.pushs.length = 0;
  banc.horloge.maintenant += 14 * MINUTE;
  const modifie = await a.demander("PATCH", `/app/conversations/${id}/messages/${envoi.message.id}`, { texte: "On mange où ce soir ?" });
  assert.equal(modifie.statut, 200, JSON.stringify(modifie.corps));
  assert.deepEqual([modifie.corps.message.texte, modifie.corps.message.modifieLe, modifie.corps.message.idClient], ["On mange où ce soir ?", new Date(banc.horloge.maintenant).toISOString(), envoi.message.idClient]);
  assert.equal(modifie.corps.version, envoi.version + 1);
  assert.notEqual(ligne.texteChiffre, avant);
  assert.ok(!ligne.texteChiffre!.includes("soir"));
  assert.equal(banc.social.dependances.chiffrement!.dechiffrerMessage(ligne.texteChiffre!, Number(id), ligne.idClient), "On mange où ce soir ?");
  const vu = await messageDuFil(b, id, envoi.message.id);
  assert.deepEqual([vu.texte, vu.modifieLe], ["On mange où ce soir ?", modifie.corps.message.modifieLe]);
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs, [], "aucune notification");

  const chemin = `/app/conversations/${id}/messages/${envoi.message.id}`;
  assert.deepEqual([(await b.demander("PATCH", chemin, { texte: "Pirate" })).statut, (await b.demander("PATCH", chemin, { texte: "Pirate" })).corps.erreur], [403, "pas-l-auteur"]);
  const intrus = await banc.creerPersonne();
  assert.equal((await intrus.demander("PATCH", chemin, { texte: "Pirate" })).statut, 404);
  assert.deepEqual((await a.demander("PATCH", chemin, { texte: "Quel connard" })).corps, { ok: false, erreur: "message-refuse", champ: "texte" });
  assert.equal((await a.demander("PATCH", chemin, { texte: "" })).corps.champ, "texte");
  banc.horloge.maintenant += 2 * MINUTE;
  assert.deepEqual([(await a.demander("PATCH", chemin, { texte: "Trop tard" })).statut, (await a.demander("PATCH", chemin, { texte: "Trop tard" })).corps.erreur], [409, "trop-tard"]);
  const lieu = (await a.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "lieu", lieuId: 41, texte: null })).corps.message;
  assert.equal((await a.demander("PATCH", `/app/conversations/${id}/messages/${lieu.id}`, { texte: "Un mot" })).corps.erreur, "non-modifiable");
  const supprime = (await ecrire(a, id, "Bientôt parti")).corps.message;
  await a.demander("DELETE", `/app/conversations/${id}/messages/${supprime.id}`);
  assert.equal((await a.demander("PATCH", `/app/conversations/${id}/messages/${supprime.id}`, { texte: "Revenu" })).corps.erreur, "non-modifiable");
  const ferme = (await ecrire(a, id, "Dernier mot")).corps.message;
  banc.tables.bande.splice(0, banc.tables.bande.length, ...banc.tables.bande.filter((l) => l.compteId !== a.compteId && l.poteId !== a.compteId));
  assert.deepEqual((await a.demander("PATCH", `/app/conversations/${id}/messages/${ferme.id}`, { texte: "Encore" })).corps.erreur, "conversation-fermee");
});

test("message de SOS Miam : chiffré, sans auteur, version + 1, aucune notification ; ni réponse, ni modification, ni signalement", async () => {
  const { a, b, id } = await deuxPotes();
  const messagerie = banc.social.dependances.messagerie;
  const version = (await lireFil(a, id)).version;
  banc.pushs.length = 0;
  const pose = await messagerie.poserMessageSysteme(Number(id), "rappel-sortie", "C'est dans 1 h, les Miamis !", new Date(banc.horloge.maintenant));
  assert.ok(pose);
  assert.equal(pose.version, version + 1);
  const ligne = banc.tables.messages.get(pose.messageId)!;
  assert.deepEqual([ligne.auteurId, ligne.systeme, ligne.type], [null, "rappel-sortie", "texte"]);
  assert.ok(ligne.texteChiffre && !ligne.texteChiffre.includes("Miamis"));
  const vu = await messageDuFil(b, id, String(pose.messageId));
  assert.deepEqual([vu.auteur, vu.systeme, vu.texte, vu.etat], [null, "rappel-sortie", "C'est dans 1 h, les Miamis !", "visible"]);
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs, []);
  assert.equal((await ecrire(a, id, "Merci", { reponseA: String(pose.messageId) })).corps.erreur, "reponse-introuvable");
  assert.equal((await a.demander("PATCH", `/app/conversations/${id}/messages/${pose.messageId}`, { texte: "Piraté" })).corps.erreur, "pas-l-auteur");
  const signale = await a.demander("POST", "/app/signalements", { cible: "message", cibleId: String(pose.messageId), raison: "haine", precision: null, explication: "" });
  assert.equal(signale.statut, 404, JSON.stringify(signale.corps));
  await assert.rejects(messagerie.poserMessageSysteme(Number(id), "Pas Un Code", "x", new Date(banc.horloge.maintenant)));
  assert.equal(await messagerie.poserMessageSysteme(999_999, "rappel-sortie", "Personne", new Date(banc.horloge.maintenant)), null);

  const supprime = (await ecrire(b, id, "Avant de partir")).corps.message;
  await banc.supprimerCompte(b);
  const orphelin = await messageDuFil(a, id, supprime.id);
  assert.deepEqual([orphelin.auteur, orphelin.systeme], [null, undefined], "Compte supprimé : pas un message de SOS Miam");
});
