import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { creerBancCommunaute, JOUR } from "./outils/creer-banc-communaute.ts";
import type { PersonneDeTest } from "./outils/creer-banc-social.ts";

let b: Awaited<ReturnType<typeof creerBancCommunaute>>;
before(async () => {
  b = await creerBancCommunaute();
});
after(() => b.banc.fermer());

const signaler = (p: PersonneDeTest, cible: string, cibleId: string, raison = "choquant") =>
  p.demander("POST", "/app/signalements", { cible, cibleId, raison, precision: null, explication: "" });
const signalement = (cible: string, cibleId: string) => [...b.banc.tables.signalements.values()].find((s) => s.cible === cible && s.cibleId === cibleId)!;
const instantane = (s: { id: number; instantaneChiffre: string | null }) => JSON.parse(b.banc.social.dependances.chiffrement!.dechiffrerInstantane(s.instantaneChiffre!, s.id));

async function fiable() {
  const p = await b.banc.creerPersonne();
  Object.assign(b.banc.memoire.comptes.get(p.compteId)!, { emailVerifieLe: b.banc.horloge.maintenant - 8 * JOUR, creeLe: b.banc.horloge.maintenant - 8 * JOUR });
  return p;
}

async function ideePubliee(auteur: PersonneDeTest, titre: string) {
  const idee = (await auteur.demander("POST", "/app/communaute/idees", { titre, detail: "Le détail de l'idée", idClient: randomUUID() })).corps.idee;
  Object.assign(b.communaute.idees.get(Number(idee.id))!, { statut: "proposee", publieeLe: new Date(b.banc.horloge.maintenant) });
  return idee.id as string;
}

test("signaler une idée : instantané chiffré, masquée pour tous au premier « choquant », jamais celle en relecture ni la sienne", async () => {
  const [auteur, temoin, lecteur] = [await b.banc.creerPersonne(), await fiable(), await b.banc.creerPersonne()];
  const enRelecture = (await auteur.demander("POST", "/app/communaute/idees", { titre: "Une idée pas encore relue", idClient: randomUUID() })).corps.idee.id;
  assert.equal((await signaler(temoin, "idee", enRelecture)).corps.erreur, "contenu-inconnu");
  const id = await ideePubliee(auteur, "Des frites gratuites le mardi pour tous");
  assert.equal((await signaler(auteur, "idee", id)).corps.erreur, "contenu-inconnu");
  const r = await signaler(temoin, "idee", id);
  assert.deepEqual([r.statut, r.corps.masquePourTous], [201, true]);
  const s = signalement("idee", id);
  assert.deepEqual(instantane(s), { v: 1, cible: "idee", titre: "Des frites gratuites le mardi pour tous", detail: "Le détail de l'idée", statut: "proposee", auteur: { pseudo: b.banc.memoire.comptes.get(auteur.compteId)!.pseudo, prenom: b.banc.memoire.comptes.get(auteur.compteId)!.prenom }, date: new Date(b.banc.horloge.maintenant).toISOString() });
  assert.equal(s.auteurContenuId, auteur.compteId);
  assert.equal((await lecteur.demander("GET", `/app/communaute/idees/${id}`)).statut, 404);
  assert.equal((await auteur.demander("GET", `/app/communaute/idees/${id}`)).statut, 200);
  assert.ok([...b.banc.tables.cloche.values()].some((n) => n.compteId === auteur.compteId && n.type === "contenu-masque"));
  const decisions = (await auteur.demander("GET", "/app/moderation/mes-decisions")).corps.decisions;
  assert.deepEqual(decisions.map((d: { cible: string; statut: string }) => [d.cible, d.statut]), [["idee", "masque"]]);
  assert.deepEqual((await signaler(temoin, "idee", id)).corps, { ok: true, deja: true });
});

test("signaler un commentaire d'idée : « choquant » le masque, une autre raison le cache seulement pour qui signale", async () => {
  const [auteur, sam, temoin] = [await b.banc.creerPersonne(), await b.banc.creerPersonne(), await fiable()];
  const idee = await ideePubliee(auteur, "Un badge pour les fans de soupe");
  const commentaire = (await sam.demander("POST", `/app/communaute/idees/${idee}/commentaires`, { texte: "La soupe, c'est la vie" })).corps.commentaire;
  const autre = await signaler(temoin, "comment-idee", commentaire.id, "arnaque");
  assert.deepEqual([autre.statut, autre.corps.masquePourTous], [201, false]);
  assert.equal((await auteur.demander("GET", `/app/communaute/idees/${idee}`)).corps.commentaires.length, 1);
  const second = await fiable();
  assert.equal((await signaler(second, "comment-idee", commentaire.id)).corps.masquePourTous, true);
  assert.equal((await auteur.demander("GET", `/app/communaute/idees/${idee}`)).corps.commentaires.length, 0);
  assert.equal((await sam.demander("GET", `/app/communaute/idees/${idee}`)).corps.commentaires.length, 1, "son auteur le voit encore");
  assert.equal(instantane(signalement("comment-idee", commentaire.id)).texte, "La soupe, c'est la vie");
});

test("signaler une sortie des Miamis : seulement si on la voit (public réservé compris), jamais masquée d'office", async () => {
  const [nina, ines, sam] = [await b.banc.creerPersonne(), await fiable(), await fiable()];
  await nina.demander("PUT", "/app/communaute/genre", { choix: "femme" });
  await ines.demander("PUT", "/app/communaute/genre", { choix: "femme" });
  const s = (await b.organiser(nina, b.nouvelleSortie(b.lieu(), { public: { type: "genre", genre: "femme" } }))).corps.sortie;
  assert.equal((await signaler(sam, "miamis", s.id)).corps.erreur, "contenu-inconnu");
  const r = await signaler(ines, "miamis", s.id);
  assert.deepEqual([r.statut, r.corps.masquePourTous], [201, false]);
  const vu = instantane(signalement("miamis", s.id));
  assert.deepEqual([vu.cible, vu.titre, vu.etiquettesLibres, vu.description], ["miamis", "Brunch des nouveaux", ["Fans de ramen"], "On papote, on goûte."]);
  assert.equal((await ines.demander("GET", `/app/communaute/sorties/${s.id}`)).statut, 200);
});
