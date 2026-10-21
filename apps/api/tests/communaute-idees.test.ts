import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { creerBancCommunaute } from "./outils/creer-banc-communaute.ts";
import type { PersonneDeTest } from "./outils/creer-banc-social.ts";

let b: Awaited<ReturnType<typeof creerBancCommunaute>>;
before(async () => {
  b = await creerBancCommunaute();
});
after(() => b.banc.fermer());

const proposer = (p: PersonneDeTest, titre: string, detail = "") => p.demander("POST", "/app/communaute/idees", { titre, detail, idClient: randomUUID() });
const publier = (id: string) => Object.assign(b.communaute.idees.get(Number(id))!, { statut: "proposee", publieeLe: new Date(b.banc.horloge.maintenant) });
const lireIdee = (p: PersonneDeTest, id: string) => p.demander("GET", `/app/communaute/idees/${id}`);
const ids = async (p: PersonneDeTest) => (await p.demander("GET", "/app/communaute/idees")).corps.idees.map((i: { id: string }) => i.id);

test("proposer : relue par la Brigade avant d'apparaître, la même phrase refusée, Idempotency-Key", async () => {
  const [lea, sam] = [await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  const cle = randomUUID();
  const cree = await lea.demander("POST", "/app/communaute/idees", { titre: "Un filtre « J'ai 10 € pour manger »", detail: "En fin de mois.", idClient: cle });
  assert.equal(cree.statut, 201);
  assert.equal(cree.corps.idee.statut, "en-relecture");
  assert.equal((await lea.demander("POST", "/app/communaute/idees", { titre: "autre chose", idClient: cle })).corps.idee.id, cree.corps.idee.id);
  assert.ok((await ids(lea)).includes(cree.corps.idee.id));
  assert.equal((await ids(sam)).includes(cree.corps.idee.id), false);
  assert.equal((await lireIdee(sam, cree.corps.idee.id)).statut, 404);
  assert.equal((await lea.demander("PUT", `/app/communaute/idees/${cree.corps.idee.id}/vote`)).corps.erreur, "idee-en-relecture");
  assert.equal((await sam.demander("PUT", `/app/communaute/idees/${cree.corps.idee.id}/vote`)).corps.erreur, "idee-inconnue");
  assert.deepEqual((await proposer(sam, "un FILTRE j'ai 10 € pour manger !")).corps, { ok: false, erreur: "idee-proche" });
  assert.deepEqual((await proposer(sam, "Soupe")).corps, { ok: false, erreur: "champ-invalide", champ: "titre" });
  assert.equal((await proposer(sam, "Des connards partout")).corps.erreur, "message-refuse");
});

test("votes « Miam ! » : un par personne, les potes nommés d'abord, une personne bloquée comptée sans être nommée", async () => {
  const [auteur, pote, inconnu, bloque, moi] = [await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  const idee = (await proposer(auteur, "Voir les lieux encore ouverts après minuit")).corps.idee;
  publier(idee.id);
  b.banc.rendrePotes(moi, pote);
  b.banc.bloquer(moi, bloque);
  for (const p of [pote, inconnu, bloque]) await p.demander("PUT", `/app/communaute/idees/${idee.id}/vote`);
  const vote = await moi.demander("PUT", `/app/communaute/idees/${idee.id}/vote`);
  assert.deepEqual([vote.corps.idee.votes, vote.corps.idee.aVote], [4, true]);
  assert.deepEqual(vote.corps.idee.votants.map((v: { id: string }) => v.id), [pote.idPublic, inconnu.idPublic]);
  assert.equal((await moi.demander("PUT", `/app/communaute/idees/${idee.id}/vote`)).corps.idee.votes, 4);
  const retire = await moi.demander("DELETE", `/app/communaute/idees/${idee.id}/vote`);
  assert.deepEqual([retire.corps.idee.votes, retire.corps.idee.aVote], [3, false]);
  b.limites.add(moi.compteId);
  assert.equal((await moi.demander("PUT", `/app/communaute/idees/${idee.id}/vote`)).statut, 200, "voter reste permis à un compte limité");
  b.limites.clear();
  assert.equal((await ids(bloque)).includes(idee.id), true);
  b.banc.bloquer(auteur, bloque);
  assert.equal((await ids(bloque)).includes(idee.id), false, "l'idée d'une personne bloquée disparaît");
});

test("commentaires : réponses sur un niveau, J'aime, supprimer le sien, masqué ou bloqué invisible", async () => {
  const [auteur, sam, nina, bloque] = [await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  const idee = (await proposer(auteur, "Le classement des meilleures frites de la ville")).corps.idee;
  assert.equal((await auteur.demander("POST", `/app/communaute/idees/${idee.id}/commentaires`, { texte: "Allez !" })).corps.erreur, "idee-en-relecture");
  publier(idee.id);
  const premier = (await sam.demander("POST", `/app/communaute/idees/${idee.id}/commentaires`, { texte: "Grave, les frites de Chez Capitaine Bouiboui !" })).corps.commentaire;
  const reponse = await nina.demander("POST", `/app/communaute/idees/${idee.id}/commentaires`, { texte: "Je vote aussi", reponseA: premier.id });
  assert.equal(reponse.statut, 201);
  const sousReponse = (await sam.demander("POST", `/app/communaute/idees/${idee.id}/commentaires`, { texte: "Merci !", reponseA: reponse.corps.commentaire.id })).corps.commentaire;
  assert.equal(sousReponse.reponseA, premier.id, "un seul niveau de réponses");
  assert.deepEqual((await nina.demander("PUT", `/app/communaute/commentaires-idees/${premier.id}/jaime`)).corps.commentaire.jaime, 1);
  assert.equal((await nina.demander("DELETE", `/app/communaute/commentaires-idees/${premier.id}`)).corps.erreur, "reserve-a-l-auteur");
  const injure = await nina.demander("POST", `/app/communaute/idees/${idee.id}/commentaires`, { texte: "connard" });
  assert.deepEqual([injure.statut, injure.corps.erreur], [400, "message-refuse"]);
  await bloque.demander("POST", `/app/communaute/idees/${idee.id}/commentaires`, { texte: "Les frites, c'est la vie" });
  b.banc.bloquer(nina, bloque);
  const vue = (await lireIdee(nina, idee.id)).corps;
  assert.equal(vue.idee.commentaires, 4);
  assert.deepEqual(vue.commentaires.map((c: { texte: string }) => c.texte), ["Grave, les frites de Chez Capitaine Bouiboui !", "Je vote aussi", "Merci !"]);
  b.communaute.commentaires.get(Number(premier.id))!.masqueLe = new Date();
  assert.equal((await lireIdee(nina, idee.id)).corps.commentaires.some((c: { id: string }) => c.id === premier.id), false);
  assert.equal((await lireIdee(sam, idee.id)).corps.commentaires.some((c: { id: string }) => c.id === premier.id), true, "son auteur le voit encore");
  b.limites.add(sam.compteId);
  assert.equal((await sam.demander("POST", `/app/communaute/idees/${idee.id}/commentaires`, { texte: "Encore moi" })).corps.erreur, "compte-limite");
  assert.equal((await proposer(sam, "Une idée de compte limité")).corps.erreur, "compte-limite");
  assert.equal((await sam.demander("DELETE", `/app/communaute/commentaires-idees/${sousReponse.id}`)).statut, 200);
  b.limites.clear();
});

test("« Ça bouge chez les Miamis » : idées publiées, réponses de la Brigade, sorties de la ville, sans les personnes bloquées", async () => {
  const [lea, sam, bloque] = [await b.banc.creerPersonne({ ville: "Rennes" }), await b.banc.creerPersonne({ ville: "Rennes" }), await b.banc.creerPersonne({ ville: "Rennes" })];
  const idee = (await proposer(sam, "Trouver un Miami pour partager un repas le midi")).corps.idee;
  publier(idee.id);
  Object.assign(b.communaute.idees.get(Number(idee.id))!, { reponseBrigade: "On adore.", reponduLe: new Date(b.banc.horloge.maintenant) });
  const s = (await b.organiser(sam, b.nouvelleSortie(b.lieu({ ville: "Rennes" })))).corps.sortie;
  await lea.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  await sam.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${lea.idPublic}`);
  const autre = (await b.organiser(bloque, b.nouvelleSortie(b.lieu({ ville: "Rennes" })))).corps.sortie;
  b.banc.bloquer(lea, bloque);
  await lea.demander("PUT", `/app/communaute/idees/${idee.id}/vote`);
  const fil = (await lea.demander("GET", "/app/communaute/fil")).corps.evenements;
  const types = fil.map((e: { type: string; id: string }) => `${e.type}:${e.id}`);
  assert.ok(types.includes(`idee-proposee:idee:${idee.id}`));
  assert.ok(types.includes(`reponse-brigade:reponse:${idee.id}`));
  assert.ok(types.includes(`sortie-organisee:sortie:${s.id}`));
  assert.ok(types.includes(`sortie-rejointe:arrivee:${s.id}:${lea.idPublic}`));
  assert.ok(types.includes(`votes-idees:votes:${lea.idPublic}`));
  const parPersonne = fil.filter((e: { type: string }) => e.type === "votes-idees" || e.type === "sortie-rejointe");
  assert.ok(parPersonne.every((e: { id: string; auteur: { id: string } }) => e.id.endsWith(`:${e.auteur.id}`)), "l'id public, jamais l'identifiant interne du compte");
  assert.equal(types.some((t: string) => t.includes(`sortie:${autre.id}`)), false);
  assert.equal(fil.find((e: { type: string }) => e.type === "reponse-brigade").auteur, null);
});
