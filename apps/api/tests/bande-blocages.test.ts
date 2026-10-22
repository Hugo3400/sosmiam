// Tests des blocages de l'app (/app/blocages) : bloquer coupe tout dans les deux sens (bande, demandes, suivis, co-auteurs et
// abonnements aux listes, invitations en attente, cloche), sort le bloqué des sorties qu'on organise, ne recrée rien ensuite ;
// on peut toujours bloquer qui nous a bloqués, sans indice. Tout en mémoire (aucune base), avec une clé de test ; la version
// Prisma est essayée avec une fausse base (verrou des deux comptes, puis tout dans la même transaction).
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

// La version Prisma se branche sur la base au chargement, sans s'y connecter : une adresse d'essai suffit (fausse base)
process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { creerBande } = await import("../src/services/bande.ts");

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

const JOUR = 24 * 60 * 60 * 1000;
const date = (decalageMs = 0) => new Date(banc.horloge.maintenant + decalageMs);
const inviter = async (p: PersonneDeTest) => (await p.demander("GET", "/app/bande/invitation")).corps.invitation as { pseudo: string; code: string };
const rejoindre = (p: PersonneDeTest, invitation: { pseudo: string; code: string }) =>
  p.demander("POST", "/app/bande/rejoindre", { pseudo: invitation.pseudo, code: invitation.code, moyen: "qr" });
const potesDe = async (p: PersonneDeTest) => ((await p.demander("GET", "/app/bande")).corps.bande.membres as { personne: { id: string } }[]).map((m) => m.personne.id);
const clocheDe = (p: PersonneDeTest) => [...banc.tables.cloche.values()].filter((n) => n.compteId === p.compteId);

test("bloquer coupe tout dans les deux sens, et sort le bloqué des sorties que j'organise ; bloquer qui nous a bloqués : 200", async () => {
  const moi = await banc.creerPersonne();
  const lui = await banc.creerPersonne();
  const temoin = await banc.creerPersonne();
  banc.rendrePotes(moi, lui);
  banc.rendrePotes(moi, temoin);
  banc.tables.demandes.push({ deId: lui.compteId, aId: moi.compteId, creeLe: date(), refuseeLe: null });
  banc.suivre(moi, lui);
  banc.suivre(lui, moi, "demande");
  banc.suivre(temoin, moi);
  const maListe = liste(moi);
  const saListe = liste(lui);
  banc.tables.coAuteurs.push({ listeId: maListe, compteId: lui.compteId, statut: "accepte", creeLe: date(), reponduLe: null });
  banc.tables.abonnementsListes.push({ listeId: maListe, compteId: lui.compteId, creeLe: date() }, { listeId: saListe, compteId: moi.compteId, creeLe: date() });
  const groupe = conversation("groupe", [moi, lui, temoin]);
  banc.tables.invitationsGroupes.push({ conversationId: conversation("groupe", [moi]), compteId: lui.compteId, inviteParId: moi.compteId, statut: "invite", creeLe: date(), reponduLe: null });
  const maSortie = sortie(moi, [[lui, "accepte"], [temoin, "accepte"]]);
  const saSortie = sortie(lui, [[moi, "invite"]]);
  const proposition = prendreId(banc.tables, "propositions");
  banc.tables.propositions.set(proposition, { id: proposition, sortieId: maSortie.id, lieuId: 7001, proposeParId: moi.compteId, creeLe: date() });
  banc.tables.votes.push({ propositionId: proposition, compteId: lui.compteId, creeLe: date() }, { propositionId: proposition, compteId: temoin.compteId, creeLe: date() });
  const noter = (destinataire: PersonneDeTest, acteur: PersonneDeTest) => {
    const id = prendreId(banc.tables, "cloche");
    banc.tables.cloche.set(id, { id, compteId: destinataire.compteId, type: "nouvel-abonne", acteurId: acteur.compteId, cible: null, cibleId: null, detail: null, enRetour: false, creeLe: date() });
  };
  noter(moi, lui);
  noter(lui, moi);
  noter(moi, temoin);

  const r = await moi.demander("PUT", `/app/blocages/${lui.idPublic}`);
  assert.deepEqual([r.statut, r.corps], [200, { ok: true }]);
  const entre = (a: number, b: number) => (a === moi.compteId && b === lui.compteId) || (a === lui.compteId && b === moi.compteId);
  assert.equal(banc.tables.bande.some((l) => entre(l.compteId, l.poteId)), false, "bande");
  assert.equal(banc.tables.demandes.some((d) => entre(d.deId, d.aId)), false, "demandes");
  assert.equal(banc.tables.suivis.some((s) => entre(s.suiveurId, s.suiviId)), false, "suivis et demandes de suivi");
  assert.equal(banc.tables.coAuteurs.some((c) => c.compteId === lui.compteId && c.listeId === maListe), false, "co-auteurs");
  assert.equal(banc.tables.abonnementsListes.some((a) => a.listeId === maListe || a.listeId === saListe), false, "abonnements aux listes de l'autre");
  assert.equal(banc.tables.invitationsGroupes.some((i) => i.compteId === lui.compteId), false, "invitation au groupe en attente");
  assert.deepEqual(banc.tables.invitationsSorties.filter((i) => i.sortieId === maSortie.id).map((i) => i.compteId), [moi.compteId, temoin.compteId], "il sort de ma sortie");
  assert.equal(banc.tables.membres.some((m) => m.conversationId === maSortie.conversationId && m.compteId === lui.compteId), false, "et de sa discussion");
  assert.deepEqual(banc.tables.votes.filter((v) => v.propositionId === proposition).map((v) => v.compteId), [temoin.compteId], "ses votes partent avec lui (comme retirerParticipant)");
  assert.equal(banc.tables.invitationsSorties.some((i) => i.sortieId === saSortie.id && i.compteId === moi.compteId), false, "son invitation en attente part");
  assert.deepEqual(clocheDe(moi).map((n) => n.acteurId), [temoin.compteId], "cloche dans les deux sens");
  assert.equal(clocheDe(lui).length, 0);
  assert.equal(banc.tables.conversations.get(groupe)!.version, 1, "le groupe commun change de version (messages cachés)");
  assert.equal(banc.tables.sorties.get(maSortie.id)!.version, 1);
  assert.equal(banc.tables.suivis.some((s) => s.suiveurId === temoin.compteId), true, "rien ne bouge pour les autres");

  assert.deepEqual((await moi.demander("GET", "/app/blocages")).corps.bloques.map((p: { id: string }) => p.id), [lui.idPublic]);
  assert.equal((await lui.demander("GET", `/app/personnes/${moi.idPublic}`)).statut, 404, "il ne sait pas qu'il est bloqué");
  assert.equal((await moi.demander("GET", `/app/personnes/${lui.idPublic}`)).corps.profil.relation.bloque, true);
  assert.deepEqual((await lui.demander("PUT", `/app/blocages/${moi.idPublic}`)).corps, { ok: true }, "bloquer qui nous a bloqués : 200");
  assert.equal((await moi.demander("PUT", `/app/blocages/${lui.idPublic}`)).statut, 200, "déjà bloqué : 200");

  // Rien ne se recrée : ni par le lien, ni par une demande
  assert.equal((await rejoindre(lui, await inviter(moi))).corps.erreur, "invitation-invalide");
  assert.equal((await moi.demander("POST", "/app/bande/demandes", { personne: lui.idPublic })).corps.erreur, "personne-inconnue");
  assert.equal((await moi.demander("DELETE", `/app/blocages/${lui.idPublic}`)).statut, 200);
  assert.deepEqual(await potesDe(moi), [temoin.idPublic], "débloquer ne rétablit rien");

  const sansPseudo = await banc.creerPersonne({ sansPseudo: true });
  assert.equal((await sansPseudo.demander("PUT", `/app/blocages/${moi.idPublic}`)).statut, 200, "pas besoin de pseudo pour bloquer");
  assert.deepEqual((await moi.demander("PUT", "/app/blocages/zzzzzzzzzz")).corps, { ok: true }, "inconnu : 200, comme qui nous a bloqués");
  assert.deepEqual((await moi.demander("DELETE", "/app/blocages/zzzzzzzzzz")).corps, { ok: true });
  assert.equal((await moi.demander("PUT", `/app/blocages/${moi.idPublic}`)).corps.champ, "personne");
  const collectionneur = await banc.creerPersonne();
  for (let i = 0; i < 1000; i++) banc.tables.blocages.push({ bloqueurId: collectionneur.compteId, bloqueId: 700_000 + i, creeLe: date() });
  assert.equal((await collectionneur.demander("PUT", `/app/blocages/${moi.idPublic}`)).corps.erreur, "trop-de-blocages");
});

test("version Prisma : bloquer verrouille, puis coupe tout dans la même transaction (le bloqué sort de mes sorties, votes compris)", async () => {
  const { base, appels } = fausseBase({ "tx.sortie.findMany": [{ id: 7, conversationId: 8, organisateurId: 1, invitations: [{ compteId: 1, creeLe: new Date(), reponduLe: null }] }] });
  const relations = { verrouillerComptes: async (_t: unknown, ids: readonly number[]) => void appels.push(`verrou:${ids.join(",")}`) };
  const r = await creerBande({ relations: relations as never, chiffrement: null, tirer: () => 0, base: base as never }).bloquer(1, 2, new Date());
  assert.deepEqual(r, { ok: true });
  assert.deepEqual(appels, [
    // Les comptes (verrou), puis les sorties, puis les conversations : le même ordre que sorties.ts
    "verrou:1,2", "tx.blocage.findUnique", "tx.blocage.count", "tx.blocage.create", "tx.sortie.updateMany", "tx.sortie.findMany",
    "tx.conversation.updateMany", "tx.invitationSortie.deleteMany", "tx.membreConversation.deleteMany", "tx.voteSortie.deleteMany", "tx.membreBande.deleteMany", "tx.demandeBande.deleteMany", "tx.suiviPersonne.deleteMany", "tx.coAuteurListe.deleteMany",
    "tx.abonnementListe.deleteMany", "tx.invitationSortie.deleteMany", "tx.invitationGroupe.deleteMany", "tx.notificationCloche.deleteMany",
  ]);
});

test("le blocage suit qui a la main sur la sortie, pas seulement la colonne de l'organisateur", async () => {
  const [ancien, nouveau, lui, autre] = [await banc.creerPersonne(), await banc.creerPersonne(), await banc.creerPersonne(), await banc.creerPersonne()];
  // L'organisateur est parti : la main passe au plus ancien participant (nouveau), la colonne n'a pas encore bougé
  const s = sortie(ancien, [[nouveau, "accepte"], [lui, "accepte"], [autre, "accepte"]]);
  banc.tables.invitationsSorties.find((i) => i.sortieId === s.id && i.compteId === nouveau.compteId)!.creeLe = date(-JOUR);
  banc.tables.invitationsSorties.splice(banc.tables.invitationsSorties.findIndex((i) => i.sortieId === s.id && i.compteId === ancien.compteId), 1);
  banc.tables.membres.splice(banc.tables.membres.findIndex((m) => m.conversationId === s.conversationId && m.compteId === ancien.compteId), 1);
  // Une sortie où lui a la main, et où nouveau est invité par quelqu'un d'autre
  const t = sortie(lui, [[nouveau, "invite"], [autre, "accepte"]]);
  banc.tables.invitationsSorties.find((i) => i.sortieId === t.id && i.compteId === nouveau.compteId)!.inviteParId = autre.compteId;
  const dans = (x: { id: number }, p: PersonneDeTest) => banc.tables.invitationsSorties.some((i) => i.sortieId === x.id && i.compteId === p.compteId);

  assert.equal((await ancien.demander("PUT", `/app/blocages/${autre.idPublic}`)).statut, 200);
  assert.equal(dans(s, autre), true, "celui qui est parti n'a plus la main : il ne sort personne");
  assert.equal((await nouveau.demander("PUT", `/app/blocages/${lui.idPublic}`)).statut, 200);
  assert.equal(dans(s, lui), false, "celui qui a la main sort le bloqué");
  assert.equal(banc.tables.membres.some((m) => m.conversationId === s.conversationId && m.compteId === lui.compteId), false, "et de sa discussion");
  assert.equal(dans(t, nouveau), false, "son invitation en attente chez celui qu'il bloque part, même invitée par un autre");
  assert.equal(dans(t, autre), true);
});

/** Une sortie, sa discussion (organisateur et participants « accepte ») et ses invitations */
function sortie(organisateur: PersonneDeTest, invites: [PersonneDeTest, "invite" | "accepte"][]) {
  const conversationId = conversation("sortie", [organisateur, ...invites.filter(([, s]) => s === "accepte").map(([p]) => p)]);
  const id = prendreId(banc.tables, "sorties");
  banc.tables.sorties.set(id, {
    id, conversationId, organisateurId: organisateur.compteId, titre: "Pizza du jeudi", emoji: "🍕", quand: date(7 * JOUR), finVote: date(6 * JOUR),
    lieuChoisiId: null, voteTermineLe: null, rappelEnvoyeLe: null, version: 0, modifieLe: date(), creeLe: date(),
  });
  banc.tables.invitationsSorties.push({ sortieId: id, compteId: organisateur.compteId, inviteParId: null, statut: "accepte", creeLe: date(), reponduLe: date() });
  for (const [p, statut] of invites) banc.tables.invitationsSorties.push({ sortieId: id, compteId: p.compteId, inviteParId: organisateur.compteId, statut, creeLe: date(), reponduLe: null });
  return { id, conversationId };
}
/** Une conversation et ses membres, dans les tables en mémoire */
function conversation(type: "prive" | "groupe" | "sortie", membres: PersonneDeTest[]) {
  const id = prendreId(banc.tables, "conversations");
  banc.tables.conversations.set(id, { id, type, clePrive: null, titreChiffre: null, emoji: null, photo: null, creeParId: null, version: 0, dernierMessageLe: date(), modifieLe: date(), creeLe: date() });
  for (const m of membres) banc.tables.membres.push({ conversationId: id, compteId: m.compteId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: date(), epingleeLe: null, luLe: null });
  return id;
}
/** Une liste de lieux */
function liste(auteur: PersonneDeTest) {
  const id = prendreId(banc.tables, "listes");
  banc.tables.listes.set(id, { id, auteurId: auteur.compteId, titre: "Pizzas du jeudi", emoji: "🍕", description: "", visibilite: "tous", suspendueLe: null, retireeLe: null, creeLe: date(), modifieLe: date() });
  return id;
}
/**
 * Une fausse base Prisma : chaque appel est noté (« tx.<modèle>.<geste> ») et rend la réponse donnée, sinon une réponse vide ;
 * $transaction passe la fausse transaction
 */
function fausseBase(reponses: Record<string, unknown> = {}) {
  const appels: string[] = [];
  const vide = (geste: string) => (geste === "count" ? 0 : geste === "findMany" ? [] : geste === "findUnique" ? null : { count: 0 });
  const repondre = (appel: string, geste: string) => (appel in reponses ? reponses[appel] : vide(geste));
  const client = (nom: string): object => new Proxy({}, {
    get: (_cible, modele: string) => new Proxy({}, { get: (_m, geste: string) => async () => (appels.push(`${nom}.${modele}.${geste}`), repondre(`${nom}.${modele}.${geste}`, geste)) }),
  });
  const tx = client("tx");
  const base = new Proxy(client("base"), { get: (cible, cle: string) => (cle === "$transaction" ? async (f: (t: object) => unknown) => f(tx) : Reflect.get(cible, cle)) });
  return { base, appels };
}
