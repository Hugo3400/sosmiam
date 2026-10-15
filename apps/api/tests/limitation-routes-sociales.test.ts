// Tests d'un compte limité dans la partie sociale de l'app (décision de Hugo du 15 octobre 2026, docs/decisions.md,
// « Modération des avis et limitation d'un compte ») : 403 « compte-limite » { details: { jusqua } } sur les écritures que
// les autres voient, AVANT le profil social (rien n'est créé) et la clé, APRÈS la limite par compte ; tout le reste passe
// (lire, accepter, voter, J'aime, signaler, contester, bloquer, quitter, supprimer le sien…) ; sans estLimite, rien n'est
// refusé ; une panne de estLimite part en 500. Tout en mémoire (aucune base), avec une fausse estLimite. L'inventaire des
// routes : limitation-inventaire-routes.test.ts.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { LIMITE_CREATIONS_SORTIES } from "../src/routes/sorties.ts";
import type { LimitationActive } from "../src/services/limitations-comptes-regles.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

const HEURE = 60 * 60_000;
const FIN = new Date("2026-11-14T10:00:00.000Z");
const PERSONNE = "abcdefghjk";

/** La fausse estLimite : les comptes limités, ses appels, et une panne à la demande */
const limites = new Map<number, LimitationActive>();
const appels: { compteId: number; maintenant: Date | undefined }[] = [];
let enPanne = false;
async function estLimite(compteId: number, maintenant?: Date) {
  appels.push({ compteId, maintenant });
  if (enPanne) throw new Error("table des limitations injoignable");
  return limites.get(compteId) ?? null;
}
const limiter = (p: PersonneDeTest, jusqua: Date | null = FIN) => limites.set(p.compteId, { jusqua, motif: "harcelement" });

/** Les 19 écritures que les autres voient, avec un corps plausible (le refus passe avant toute vérification) */
const ECRITURES_REFUSEES: [methode: string, chemin: string, corps?: Record<string, unknown>][] = [
  ["POST", "/app/bande/rejoindre", { pseudo: "miami.1", code: "abcdefgh", moyen: "lien" }],
  ["POST", "/app/bande/demandes", { personne: PERSONNE }],
  ["PUT", `/app/suivis-personnes/abonnements/${PERSONNE}`],
  ["POST", "/app/conversations/groupes", { titre: "Les gourmands", emoji: "🍕", invites: [PERSONNE], idClient: randomUUID() }],
  ["PATCH", "/app/conversations/1", { titre: "Les affamés" }],
  ["POST", "/app/conversations/1/invites", { invites: [PERSONNE] }],
  ["POST", "/app/conversations/1/messages", { idClient: randomUUID(), type: "texte", texte: "On mange où ?" }],
  ["POST", "/app/conversations/1/medias"],
  ["PUT", "/app/conversations/1/messages/1/reactions/coeur"],
  ["POST", "/app/lieux-envoyes", { idClient: randomUUID(), lieuId: 1, a: [PERSONNE], mot: "Goûte ça !" }],
  ["POST", "/app/sorties", { titre: "Pizza du jeudi", emoji: "🍕", quand: "2026-10-16T19:00:00Z", finVote: "2026-10-15T19:00:00Z", invites: [PERSONNE], lieux: [1], idClient: randomUUID() }],
  ["POST", "/app/sorties/1/invites", { invites: [PERSONNE] }],
  ["POST", "/app/sorties/1/propositions", { lieuId: 1 }],
  ["POST", "/app/listes", { titre: "Mes cantines", emoji: "🍜", visibilite: "tous", idClient: randomUUID() }],
  ["PATCH", "/app/listes/1", { titre: "Mes adresses" }],
  ["PUT", "/app/listes/1/lieux/1"],
  ["POST", "/app/listes/1/co-auteurs", { personne: PERSONNE }],
  ["POST", "/app/commentaires/publications/1", { texte: "Trop bon, ce bouiboui !" }],
  ["PATCH", "/app/commentaires/1", { texte: "Vraiment trop bon !" }],
];
const refusAttendu = (jusqua: Date | null = FIN) => ({ ok: false, erreur: "compte-limite", details: { jusqua: jusqua?.toISOString() ?? null } });

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
let sansCle: Awaited<ReturnType<typeof creerBancSocial>>;
let sansService: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial({ estLimite });
  sansCle = await creerBancSocial({ estLimite, sansCle: true });
  sansService = await creerBancSocial();
});
after(async () => {
  await banc.fermer();
  await sansCle.fermer();
  await sansService.fermer();
});

let dernierLieu = 500;
/** Un lieu publié et une publication publiée de ce lieu (id de la publication = id du lieu) */
function preparerLieu() {
  dernierLieu += 1;
  banc.tables.lieux.set(dernierLieu, { statut: "publie", nom: `Le Bouiboui du Capitaine n°${dernierLieu}` });
  banc.tables.publications.set(dernierLieu, { lieuId: dernierLieu, statut: "publiee" });
  return dernierLieu;
}
const iso = (decalageMs: number) => new Date(banc.horloge.maintenant + decalageMs).toISOString();

test("compte limité : 403 compte-limite, de la même forme, sur chacune des écritures que les autres voient, sans créer de profil social", async () => {
  const limite = await banc.creerPersonne({ sansProfil: true });
  limiter(limite);
  appels.length = 0;
  for (const [methode, chemin, corps] of ECRITURES_REFUSEES) {
    const r = await limite.demander(methode, chemin, corps);
    assert.equal(r.statut, 403, `${methode} ${chemin} : ${JSON.stringify(r.corps)}`);
    assert.deepEqual(r.corps, refusAttendu(), `${methode} ${chemin}`);
  }
  assert.equal(banc.tables.profils.has(limite.compteId), false, "un refus ne crée jamais le profil social");
  assert.deepEqual((await limite.demander("GET", "/app/social/moi")).corps.moi, null);
  // estLimite reçoit le compte de la session et l'heure de l'API (son horloge)
  assert.equal(appels.length, ECRITURES_REFUSEES.length);
  for (const appel of appels) {
    assert.equal(appel.compteId, limite.compteId);
    assert.equal(appel.maintenant?.getTime(), banc.horloge.maintenant);
  }
  // Jusqu'à nouvel ordre : jusqua null
  limiter(limite, null);
  assert.deepEqual((await limite.demander("POST", "/app/listes", { titre: "Encore", emoji: "🍜", visibilite: "tous", idClient: randomUUID() })).corps, refusAttendu(null));
});

test("compte limité sans pseudo, API sans clé : toujours 403 (le refus passe avant le profil social et la clé)", async () => {
  const limite = await sansCle.creerPersonne({ sansPseudo: true });
  limites.set(limite.compteId, { jusqua: FIN, motif: "harcelement" });
  for (const [methode, chemin, corps] of ECRITURES_REFUSEES) {
    const r = await limite.demander(methode, chemin, corps);
    assert.deepEqual([r.statut, r.corps], [403, refusAttendu()], `${methode} ${chemin} : ni 409 pseudo-requis, ni 503 chiffrement-indisponible`);
  }
  assert.equal(sansCle.tables.profils.has(limite.compteId), false);
  // Sans limitation, la même personne bute bien sur le pseudo, puis la clé
  const libre = await sansCle.creerPersonne({ sansPseudo: true });
  assert.equal((await libre.demander("POST", "/app/listes", { titre: "Mes cantines", emoji: "🍜", visibilite: "tous", idClient: randomUUID() })).statut, 409);
});

test("compte limité : la limite par compte compte d'abord (429 après le maximum, comme pour tout le monde)", async () => {
  const limite = await banc.creerPersonne();
  limiter(limite);
  const creer = () => limite.demander("POST", "/app/sorties", { titre: "Pizza", emoji: "🍕", quand: iso(3 * HEURE), finVote: iso(HEURE), invites: [PERSONNE], lieux: [1], idClient: randomUUID() });
  for (let i = 0; i < LIMITE_CREATIONS_SORTIES.maximum; i += 1) assert.equal((await creer()).statut, 403);
  const trop = await creer();
  assert.equal(trop.statut, 429);
  assert.equal(trop.corps.erreur, "trop-de-demandes");
});

test("compte limité : les gestes permis passent (lire, accepter, voter, J'aime, signaler, contester, bloquer, quitter, supprimer le sien…)", async () => {
  const limite = await banc.creerPersonne({ prive: true });
  const pote = await banc.creerPersonne();
  const curieux = await banc.creerPersonne();
  banc.rendrePotes(limite, pote);
  const lieu = preparerLieu();
  // Avant la limitation : une liste et un commentaire à elle
  const liste = await limite.demander("POST", "/app/listes", { titre: "Mes cantines", emoji: "🍜", visibilite: "tous", idClient: randomUUID() });
  assert.equal(liste.statut, 201, JSON.stringify(liste.corps));
  const commentaire = await limite.demander("POST", `/app/commentaires/publications/${lieu}`, { texte: "Trop bon, ce bouiboui !" });
  assert.equal(commentaire.statut, 201, JSON.stringify(commentaire.corps));
  // Ce que les autres lui proposent : un groupe, une sortie, une liste à remplir, une demande de bande, une demande de suivi
  const groupe = await pote.demander("POST", "/app/conversations/groupes", { titre: "Les gourmands", emoji: "🍕", invites: [limite.idPublic], idClient: randomUUID() });
  assert.equal(groupe.statut, 201, JSON.stringify(groupe.corps));
  const sortie = await pote.demander("POST", "/app/sorties", {
    titre: "Pizza du jeudi", emoji: "🍕", quand: iso(3 * HEURE), finVote: iso(HEURE), invites: [limite.idPublic], lieux: [lieu], idClient: randomUUID(),
  });
  assert.equal(sortie.statut, 201, JSON.stringify(sortie.corps));
  const listePote = await pote.demander("POST", "/app/listes", { titre: "À deux", emoji: "🥟", visibilite: "tous", idClient: randomUUID() });
  assert.equal((await pote.demander("POST", `/app/listes/${listePote.corps.liste.id}/co-auteurs`, { personne: limite.idPublic })).statut, 201);
  assert.equal((await curieux.demander("POST", "/app/bande/demandes", { personne: limite.idPublic })).statut, 201);
  assert.equal((await curieux.demander("PUT", `/app/suivis-personnes/abonnements/${limite.idPublic}`)).statut, 201);
  const commentairePote = await pote.demander("POST", `/app/commentaires/publications/${lieu}`, { texte: "Le meilleur kebab de la ville." });

  limiter(limite);
  const groupeId = groupe.corps.conversation.id;
  const sortieId = sortie.corps.sortie.id;
  const gestes: [methode: string, chemin: string, corps: unknown, attendu: number][] = [
    ["GET", "/app/listes", undefined, 200],
    ["GET", "/app/bande", undefined, 200],
    ["GET", "/app/social/export", undefined, 200],
    ["PATCH", "/app/social/moi", { pushSocial: false }, 200],
    ["POST", "/app/personnes/recherche", { debut: "miami" }, 200],
    ["PUT", "/app/masques/suggestion/a1", undefined, 200],
    ["POST", "/app/cloche/vu", {}, 200],
    ["POST", `/app/conversations/${groupeId}/reponse`, { rejoint: true }, 200],
    ["PUT", `/app/conversations/${groupeId}/notifications`, { coupees: true }, 200],
    ["POST", `/app/sorties/${sortieId}/reponse`, { vient: true }, 200],
    ["PUT", `/app/sorties/${sortieId}/votes/${lieu}`, undefined, 200],
    ["POST", `/app/listes/${listePote.corps.liste.id}/co-auteurs/moi/accepter`, undefined, 200],
    ["POST", `/app/bande/demandes/${curieux.idPublic}/accepter`, undefined, 200],
    ["POST", `/app/suivis-personnes/demandes/${curieux.idPublic}/accepter`, undefined, 200],
    ["PUT", `/app/commentaires/${commentairePote.corps.commentaire.id}/jaime`, undefined, 200],
    ["POST", "/app/signalements", { cible: "profil", cibleId: curieux.idPublic, raison: "haine", precision: null, explication: "" }, 201],
    ["POST", "/app/moderation/999/contestation", { texte: "Je conteste cette décision." }, 404],
    ["PUT", `/app/blocages/${curieux.idPublic}`, undefined, 200],
    ["DELETE", `/app/blocages/${curieux.idPublic}`, undefined, 200],
    ["DELETE", `/app/commentaires/${commentaire.corps.commentaire.id}`, undefined, 200],
    ["DELETE", `/app/listes/${liste.corps.liste.id}`, undefined, 200],
    ["DELETE", `/app/sorties/${sortieId}/participation`, undefined, 200],
    ["DELETE", `/app/conversations/${groupeId}/membres/moi`, undefined, 200],
    ["DELETE", `/app/bande/${pote.idPublic}`, undefined, 200],
  ];
  for (const [methode, chemin, corps, attendu] of gestes) {
    const r = await limite.demander(methode, chemin, corps);
    assert.equal(r.statut, attendu, `${methode} ${chemin} : ${JSON.stringify(r.corps)}`);
    assert.notEqual(r.corps.erreur, "compte-limite");
  }
  // Ce qu'elle écrirait pour les autres reste refusé, même là où elle vient d'entrer
  assert.deepEqual((await limite.demander("POST", `/app/sorties/${sortieId}/propositions`, { lieuId: lieu })).corps, refusAttendu());
  // Un compte qui n'est pas limité écrit comme avant, sur la même API
  assert.equal((await pote.demander("POST", "/app/listes", { titre: "Encore une", emoji: "🌮", visibilite: "bande", idClient: randomUUID() })).statut, 201);
});

test("sans estLimite branchée : rien n'est refusé pour limitation", async () => {
  const personne = await sansService.creerPersonne();
  for (const [methode, chemin, corps] of ECRITURES_REFUSEES) {
    const r = await personne.demander(methode, chemin, corps);
    assert.notEqual(r.corps.erreur, "compte-limite", `${methode} ${chemin}`);
    assert.notEqual(r.statut, 500, `${methode} ${chemin} : ${JSON.stringify(r.corps)}`);
  }
  const liste = await personne.demander("POST", "/app/listes", { titre: "Mes cantines", emoji: "🍜", visibilite: "tous", idClient: randomUUID() });
  assert.equal(liste.statut, 201);
});

test("une panne de estLimite part en 500 (rien n'est écrit, aucun profil créé) ; les lectures ne la consultent pas", async (t) => {
  t.mock.method(console, "error", () => {});
  const personne = await banc.creerPersonne({ sansProfil: true });
  enPanne = true;
  try {
    const r = await personne.demander("POST", "/app/listes", { titre: "Mes cantines", emoji: "🍜", visibilite: "tous", idClient: randomUUID() });
    assert.deepEqual([r.statut, r.corps], [500, { ok: false, erreur: "erreur-serveur" }]);
    const commentaire = await personne.demander("POST", `/app/commentaires/publications/${preparerLieu()}`, { texte: "Trop bon !" });
    assert.deepEqual([commentaire.statut, commentaire.corps], [500, { ok: false, erreur: "erreur-serveur" }]);
    assert.equal(banc.tables.profils.has(personne.compteId), false);
    assert.equal([...banc.tables.listes.values()].some((l) => l.auteurId === personne.compteId), false);
    assert.equal((await personne.demander("GET", "/app/listes")).statut, 200);
    assert.equal((await personne.demander("POST", "/app/cloche/vu", {})).statut, 200);
  } finally {
    enPanne = false;
  }
});
