// Tests des commentaires des publications (/app/commentaires, lot L6) : lecture publique sans session, réponses sur un seul
// niveau, mentions gardées avec l'identifiant public, réponse du lieu par son gérant, masquage par le lieu (signalement
// « lieu » et instantané), « Commentaire supprimé », modifier, J'aime, blocages. Tout en mémoire (banc de la partie sociale).
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { presenterCommentaire } from "../src/fonctions/social/presenter-commentaire.ts";
import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

const roles = new Map<string, "gerant" | "equipe">();
let banc: Awaited<ReturnType<typeof creerBancSocial>>;
let publication = 0;
before(async () => {
  banc = await creerBancSocial({ lireRole: async (compteId, lieuId) => roles.get(`${compteId}:${lieuId}`) ?? null });
});
after(() => banc.fermer());

/** Une publication publiée d'un lieu publié (id du lieu = id de la publication + 100) */
function preparerPublication(statut = "publiee") {
  publication += 1;
  banc.tables.lieux.set(publication + 100, { statut: "publie" });
  banc.tables.publications.set(publication, { lieuId: publication + 100, statut });
  return { id: publication, lieuId: publication + 100 };
}
const chemin = (publicationId: number) => `/app/commentaires/publications/${publicationId}`;
const commenter = (p: PersonneDeTest, publicationId: number, corps: Record<string, unknown>) => p.demander("POST", chemin(publicationId), corps);
const lirePublic = (publicationId: number) => banc.demander("GET", chemin(publicationId));
const clocheDe = (p: PersonneDeTest) => [...banc.tables.cloche.values()].filter((l) => l.compteId === p.compteId);

test("presenterCommentaire : la réponse du lieu est signée « le lieu », un supprimé n'a plus de texte ni de mentions", () => {
  const ligne = {
    id: 3, publicationId: 9, auteurId: null, commeLieuId: 4, texte: "Merci !", mentions: [{ p: "lea.m", id: "abcdefghjk" }, { p: 1 }], reponseAId: 2,
    creeLe: new Date("2026-10-14T10:00:00Z"), modifieLe: null, supprimeLe: null, masqueParLieuLe: null, suspenduLe: null, jaimes: 2,
  };
  assert.deepEqual(presenterCommentaire(ligne, null), {
    id: "3", publicationId: "9", auteur: { type: "lieu" }, texte: "Merci !", date: "2026-10-14T10:00:00.000Z", modifieLe: null, supprime: false,
    jaimes: 2, reponseA: "2", mentions: [{ pseudo: "lea.m", id: "abcdefghjk" }],
  });
  const supprime = presenterCommentaire({ ...ligne, supprimeLe: new Date() }, null);
  assert.equal(supprime?.texte, "");
  assert.deepEqual(supprime?.mentions, []);
  assert.equal(presenterCommentaire({ ...ligne, commeLieuId: null, auteurId: 5 }, null), null, "une personne qu'on ne peut pas présenter ne sort pas");
});

test("lecture publique sans session, en cache 30 s ; publication inconnue ou pas visible : 404", async () => {
  const p = preparerPublication();
  const lea = await banc.creerPersonne({ pseudo: "lea.public" });
  const ecrit = await commenter(lea, p.id, { texte: "Les pâtes sont folles ici" });
  assert.equal(ecrit.statut, 201);
  assert.deepEqual(ecrit.corps.commentaire.auteur, { type: "personne", personne: { id: lea.idPublic, pseudo: "lea.public", prenom: ecrit.corps.commentaire.auteur.personne.prenom, avatar: null } });
  const lu = await lirePublic(p.id);
  assert.equal(lu.statut, 200);
  assert.equal(lu.entetes.get("cache-control"), "public, max-age=30");
  assert.equal(lu.corps.total, 1);
  assert.deepEqual(lu.corps.commentaires.map((c: { texte: string }) => c.texte), ["Les pâtes sont folles ici"]);
  assert.equal(lu.corps.suite, null);
  assert.equal((await lirePublic(999)).corps.erreur, "publication-inconnue");
  const cachee = preparerPublication("masquee");
  assert.equal((await lirePublic(cachee.id)).statut, 404);
  assert.equal((await commenter(lea, cachee.id, { texte: "Coucou" })).statut, 404);
  const mal = await banc.demander("GET", "/app/commentaires/publications/abc");
  assert.deepEqual([mal.statut, mal.corps.champ], [400, "publicationId"]);
});

test("écrire : pseudo obligatoire, texte de 1 à 500 caractères, filtre de mots", async () => {
  const p = preparerPublication();
  const sansPseudo = await banc.creerPersonne({ sansPseudo: true });
  assert.equal((await commenter(sansPseudo, p.id, { texte: "Bonjour" })).corps.erreur, "pseudo-requis");
  const lea = await banc.creerPersonne({ pseudo: "lea.ecrit" });
  assert.deepEqual((await commenter(lea, p.id, { texte: "   " })).corps, { ok: false, erreur: "champ-invalide", champ: "texte" });
  assert.equal((await commenter(lea, p.id, { texte: "x".repeat(501) })).statut, 400);
  assert.deepEqual((await commenter(lea, p.id, { texte: "Le patron est un connard" })).corps, { ok: false, erreur: "message-refuse", champ: "texte" });
  assert.equal((await commenter(lea, p.id, { texte: "Bon", reponseA: 12 })).corps.champ, "reponseA");
  assert.equal((await commenter(lea, p.id, { texte: "x".repeat(500) })).statut, 201);
  assert.equal((await banc.demander("POST", chemin(p.id), { corps: { texte: "Sans compte" } })).statut, 401);
});

test("réponses sur un seul niveau, et « reponse-commentaire » pour l'auteur du commentaire auquel on répond", async () => {
  const p = preparerPublication();
  const a = await banc.creerPersonne({ pseudo: "a.niveau" });
  const b = await banc.creerPersonne({ pseudo: "b.niveau" });
  const c = await banc.creerPersonne({ pseudo: "c.niveau" });
  const premier = (await commenter(a, p.id, { texte: "Premier" })).corps.commentaire;
  const reponse = (await commenter(b, p.id, { texte: "Réponse", reponseA: premier.id })).corps.commentaire;
  const sousReponse = (await commenter(c, p.id, { texte: "Sous-réponse", reponseA: reponse.id })).corps.commentaire;
  assert.equal(reponse.reponseA, premier.id);
  assert.equal(sousReponse.reponseA, premier.id, "une réponse à une réponse va sous son commentaire");
  const pourA = clocheDe(a).filter((l) => l.type === "reponse-commentaire");
  assert.deepEqual(pourA.map((l) => [l.acteurId, l.cible, l.cibleId]), [[b.compteId, "publication", String(p.id)]]);
  assert.equal(clocheDe(b).filter((l) => l.type === "reponse-commentaire").length, 1, "B reçoit la réponse de C");
  const autre = preparerPublication();
  assert.equal((await commenter(a, autre.id, { texte: "Ailleurs", reponseA: premier.id })).corps.erreur, "commentaire-inconnu", "pas d'une autre publication");
});

test("mentions : gardées avec l'identifiant public, la cloche seulement pour un abonné ou un pote ; un pseudo repris n'en hérite pas", async () => {
  const p = preparerPublication();
  const auteur = await banc.creerPersonne({ pseudo: "auteur.mention" });
  const abonnee = await banc.creerPersonne({ pseudo: "lea.mention" });
  const pote = await banc.creerPersonne({ pseudo: "pote.mention" });
  const inconnue = await banc.creerPersonne({ pseudo: "zoe.mention" });
  banc.suivre(abonnee, auteur);
  banc.rendrePotes(auteur, pote);
  const r = await commenter(auteur, p.id, { texte: "Merci @Lea.Mention, @pote.mention et @zoe.mention ! Et @personne.ici" });
  assert.equal(r.statut, 201);
  assert.deepEqual(r.corps.commentaire.mentions, [
    { pseudo: "lea.mention", id: abonnee.idPublic }, { pseudo: "pote.mention", id: pote.idPublic }, { pseudo: "zoe.mention", id: inconnue.idPublic },
  ]);
  assert.equal(clocheDe(abonnee).filter((l) => l.type === "mention").length, 1);
  assert.equal(clocheDe(pote).filter((l) => l.type === "mention").length, 1);
  assert.equal(clocheDe(inconnue).filter((l) => l.type === "mention").length, 0, "ni abonnée ni pote : pas prévenue");
  // Léa change de pseudo, quelqu'un d'autre reprend l'ancien : la mention suit toujours Léa
  banc.memoire.comptes.get(abonnee.compteId)!.pseudo = "lea.nouveau";
  const reprend = await banc.creerPersonne({ pseudo: "lea.mention" });
  const relu = (await lirePublic(p.id)).corps.commentaires.find((c: { id: string }) => c.id === r.corps.commentaire.id);
  assert.equal(relu.mentions[0].id, abonnee.idPublic);
  assert.notEqual(relu.mentions[0].id, reprend.idPublic);
});

test("réponse du lieu : seulement le gérant (après les 404), signée « le lieu », et la réponse part sans acteur", async () => {
  const p = preparerPublication();
  const client = await banc.creerPersonne({ pseudo: "client.lieu" });
  const gerant = await banc.creerPersonne({ pseudo: "gerant.lieu" });
  const equipe = await banc.creerPersonne({ pseudo: "equipe.lieu" });
  roles.set(`${gerant.compteId}:${p.lieuId}`, "gerant");
  roles.set(`${equipe.compteId}:${p.lieuId}`, "equipe");
  const question = (await commenter(client, p.id, { texte: "Vous ouvrez dimanche ?" })).corps.commentaire;
  assert.equal((await commenter(equipe, p.id, { texte: "Oui", commeLieu: true })).corps.erreur, "reserve-au-gerant");
  assert.equal((await commenter(equipe, 999, { texte: "Oui", commeLieu: true })).statut, 404, "404 avant 403");
  const reponse = await commenter(gerant, p.id, { texte: "Oui, de 12 h à 15 h !", reponseA: question.id, commeLieu: true });
  assert.equal(reponse.statut, 201);
  assert.deepEqual(reponse.corps.commentaire.auteur, { type: "lieu" });
  assert.equal(JSON.stringify(reponse.corps).includes(gerant.idPublic!), false, "jamais le gérant qui l'a écrite");
  const notification = clocheDe(client).find((l) => l.type === "reponse-commentaire");
  assert.deepEqual([notification?.acteurId, notification?.detail], [null, "lieu"]);
  assert.equal((await gerant.demander("GET", `${chemin(p.id)}/moi`)).corps.moi.peutRepondreCommeLieu, true);
  assert.equal((await client.demander("GET", `${chemin(p.id)}/moi`)).corps.moi.peutRepondreCommeLieu, false);
  // Le gérant supprime la réponse du lieu ; quelqu'un d'autre ne peut pas
  assert.equal((await client.demander("DELETE", `/app/commentaires/${reponse.corps.commentaire.id}`)).corps.erreur, "reserve-a-l-auteur");
  assert.equal((await gerant.demander("DELETE", `/app/commentaires/${reponse.corps.commentaire.id}`)).statut, 200);
});

test("masquer au nom du lieu : modération (un seul signalement « lieu » ouvert), « contenu-masque », puis deja-examine après un rejet", async () => {
  const p = preparerPublication();
  const auteur = await banc.creerPersonne({ pseudo: "auteur.masque" });
  const gerant = await banc.creerPersonne({ pseudo: "gerant.masque" });
  const passant = await banc.creerPersonne({ pseudo: "passant.masque" });
  roles.set(`${gerant.compteId}:${p.lieuId}`, "gerant");
  const c = (await commenter(auteur, p.id, { texte: "Service lent, plats froids" })).corps.commentaire;
  const masque = `/app/commentaires/${c.id}/masque`;
  assert.equal((await passant.demander("PUT", masque)).corps.erreur, "reserve-au-gerant");
  assert.deepEqual((await gerant.demander("PUT", masque)).corps, { ok: true });
  assert.equal((await lirePublic(p.id)).corps.total, 0, "plus visible de tout le monde");
  const miens = (await auteur.demander("GET", `${chemin(p.id)}/moi`)).corps.moi.miens;
  assert.deepEqual(miens.map((m: { id: string; etat: string }) => [m.id, m.etat]), [[c.id, "masque-par-le-lieu"]]);
  const lieu = () => [...banc.tables.signalements.values()].filter((s) => s.cible === "commentaire" && s.cibleId === c.id && s.source === "lieu");
  assert.equal(lieu().length, 1);
  const [signalement] = lieu();
  assert.deepEqual([signalement!.raison, signalement!.explication, signalement!.auteurContenuId, signalement!.lieuId], ["autre", "Masqué par le lieu", auteur.compteId, p.lieuId]);
  const instantane = JSON.parse(banc.social.dependances.chiffrement!.dechiffrerInstantane(signalement!.instantaneChiffre!, signalement!.id));
  assert.equal(instantane.texte, "Service lent, plats froids");
  const prevenu = clocheDe(auteur).find((l) => l.type === "contenu-masque");
  assert.deepEqual([prevenu?.acteurId, prevenu?.detail, prevenu?.cible, prevenu?.cibleId], [null, "masque-par-le-lieu", "signalement", String(signalement!.id)]);
  assert.equal((await passant.demander("PUT", masque)).statut, 404, "masqué : invisible pour les autres");
  // Démasquer, puis masquer de nouveau : le même signalement ouvert
  assert.equal((await gerant.demander("DELETE", masque)).statut, 200);
  assert.equal((await lirePublic(p.id)).corps.total, 1);
  assert.equal((await gerant.demander("PUT", masque)).statut, 200);
  assert.equal(lieu().length, 1);
  // Masquer deux fois ne fait rien de plus : ni signalement, ni « contenu-masque » de plus
  const prevenus = () => clocheDe(auteur).filter((l) => l.type === "contenu-masque").length;
  const avant = prevenus();
  assert.equal((await gerant.demander("PUT", masque)).statut, 200);
  assert.deepEqual([lieu().length, prevenus()], [1, avant], "masquer deux fois ne fait rien de plus");
  // La modération rejette (le logiciel vide masqueParLieuLe) : le lieu ne peut plus masquer ce commentaire
  Object.assign(signalement!, { statut: "rejete", traiteLe: new Date(banc.horloge.maintenant) });
  banc.tables.commentaires.get(Number(c.id))!.masqueParLieuLe = null;
  assert.equal((await gerant.demander("PUT", masque)).corps.erreur, "deja-examine");
  // Même modifié depuis par son auteur : « aucun rejet passé sur ce contenu » (Hugo, I.18 a)
  banc.horloge.maintenant += 60_000;
  assert.equal((await auteur.demander("PATCH", `/app/commentaires/${c.id}`, { texte: "Service lent, plats froids, et pire encore" })).statut, 200);
  banc.horloge.maintenant += 60_000;
  assert.equal((await gerant.demander("PUT", masque)).corps.erreur, "deja-examine");
  assert.deepEqual([lieu().length, banc.tables.commentaires.get(Number(c.id))!.masqueParLieuLe], [1, null]);
  // Une réponse du lieu, ou son propre commentaire, ne se masquent pas
  const sien = (await commenter(gerant, p.id, { texte: "Le mien" })).corps.commentaire;
  assert.equal((await gerant.demander("PUT", `/app/commentaires/${sien.id}/masque`)).corps.erreur, "commentaire-inconnu");
});

test("masquer au nom du lieu sans clé des données : 503 coffre-fort fermé", async () => {
  const sansCle = await creerBancSocial({ sansCle: true });
  try {
    const p = { id: 1, lieuId: 101 };
    sansCle.tables.lieux.set(p.lieuId, { statut: "publie" });
    sansCle.tables.publications.set(p.id, { lieuId: p.lieuId, statut: "publiee" });
    const lea = await sansCle.creerPersonne({ pseudo: "lea.sans.cle" });
    const c = (await lea.demander("POST", chemin(p.id), { texte: "Coucou" })).corps.commentaire;
    assert.equal((await lea.demander("PUT", `/app/commentaires/${c.id}/masque`)).corps.erreur, "chiffrement-indisponible");
  } finally {
    await sansCle.fermer();
  }
});

test("supprimer : avec des réponses, « Commentaire supprimé » et les réponses restent ; sans, effacé ; le sien seulement", async () => {
  const p = preparerPublication();
  const a = await banc.creerPersonne({ pseudo: "a.suppr" });
  const b = await banc.creerPersonne({ pseudo: "b.suppr" });
  const parent = (await commenter(a, p.id, { texte: "Avec réponse" })).corps.commentaire;
  const reponse = (await commenter(b, p.id, { texte: "La réponse", reponseA: parent.id })).corps.commentaire;
  const seul = (await commenter(a, p.id, { texte: "Tout seul" })).corps.commentaire;
  assert.equal((await b.demander("DELETE", `/app/commentaires/${parent.id}`)).corps.erreur, "reserve-a-l-auteur");
  assert.equal((await a.demander("DELETE", `/app/commentaires/${parent.id}`)).statut, 200);
  assert.equal((await a.demander("DELETE", `/app/commentaires/${seul.id}`)).statut, 200);
  const lu = (await lirePublic(p.id)).corps;
  const parId = new Map(lu.commentaires.map((c: { id: string }) => [c.id, c]));
  assert.deepEqual(parId.get(parent.id), { ...parent, texte: "", supprime: true, mentions: [] });
  assert.ok(parId.has(reponse.id));
  assert.equal(parId.has(seul.id), false);
  assert.equal(banc.tables.commentaires.has(Number(seul.id)), false, "effacé pour de bon");
  assert.equal(lu.total, 1, "seule la réponse compte");
  assert.equal((await a.demander("DELETE", `/app/commentaires/${parent.id}`)).corps.erreur, "commentaire-inconnu", "déjà supprimé");
});

test("modifier : le sien seulement, « modifié », et seules les nouvelles mentions préviennent", async () => {
  const p = preparerPublication();
  const a = await banc.creerPersonne({ pseudo: "a.modif" });
  const pote1 = await banc.creerPersonne({ pseudo: "pote1.modif" });
  const pote2 = await banc.creerPersonne({ pseudo: "pote2.modif" });
  banc.rendrePotes(a, pote1);
  banc.rendrePotes(a, pote2);
  const c = (await commenter(a, p.id, { texte: "Avec @pote1.modif" })).corps.commentaire;
  banc.horloge.maintenant += 25 * 60 * 60 * 1000;
  const modifie = await a.demander("PATCH", `/app/commentaires/${c.id}`, { texte: "Avec @pote1.modif et @pote2.modif" });
  assert.equal(modifie.statut, 200);
  assert.equal(modifie.corps.commentaire.modifieLe, new Date(banc.horloge.maintenant).toISOString());
  assert.equal(clocheDe(pote1).filter((l) => l.type === "mention").length, 1, "déjà citée : pas une deuxième fois");
  assert.equal(clocheDe(pote2).filter((l) => l.type === "mention").length, 1);
  assert.equal((await pote1.demander("PATCH", `/app/commentaires/${c.id}`, { texte: "Pas à moi" })).corps.erreur, "reserve-a-l-auteur");
  assert.equal((await a.demander("PATCH", "/app/commentaires/99999", { texte: "Rien" })).corps.erreur, "commentaire-inconnu");
});

test("J'aime : sans doublon, lus dans /moi, sans prévenir personne ; impossible avec un blocage", async () => {
  const p = preparerPublication();
  const a = await banc.creerPersonne({ pseudo: "a.jaime" });
  const b = await banc.creerPersonne({ pseudo: "b.jaime" });
  const bloqueur = await banc.creerPersonne({ pseudo: "bloqueur.jaime" });
  const c = (await commenter(a, p.id, { texte: "Aimez-moi" })).corps.commentaire;
  const jaime = `/app/commentaires/${c.id}/jaime`;
  assert.deepEqual((await b.demander("PUT", jaime)).corps, { ok: true, jaimes: 1 });
  assert.deepEqual((await b.demander("PUT", jaime)).corps, { ok: true, jaimes: 1 });
  assert.deepEqual((await b.demander("GET", `${chemin(p.id)}/moi`)).corps.moi.jaimes, [c.id]);
  assert.equal((await lirePublic(p.id)).corps.commentaires[0].jaimes, 1);
  assert.deepEqual((await b.demander("DELETE", jaime)).corps, { ok: true, jaimes: 0 });
  assert.equal(clocheDe(a).length, 0);
  banc.bloquer(a, bloqueur);
  assert.equal((await bloqueur.demander("PUT", jaime)).corps.erreur, "commentaire-inconnu");
  const sansPseudo = await banc.creerPersonne({ sansPseudo: true });
  assert.equal((await sansPseudo.demander("PUT", jaime)).statut, 200, "aimer ne demande pas de pseudo");
});

test("blocages : les commentaires de qui t'a bloqué restent lisibles, sans pouvoir y répondre ni le citer", async () => {
  const p = preparerPublication();
  const moi = await banc.creerPersonne({ pseudo: "moi.bloque" });
  const elle = await banc.creerPersonne({ pseudo: "elle.bloque" });
  banc.bloquer(elle, moi);
  const sien = (await commenter(elle, p.id, { texte: "Je suis là" })).corps.commentaire;
  assert.equal((await lirePublic(p.id)).corps.total, 1);
  assert.equal((await commenter(moi, p.id, { texte: "Réponse", reponseA: sien.id })).corps.erreur, "commentaire-inconnu");
  const cite = await commenter(moi, p.id, { texte: "Coucou @elle.bloque" });
  assert.deepEqual(cite.corps.commentaire.mentions, [], "mention laissée en texte simple");
  assert.equal(clocheDe(elle).length, 0);
});

test("répondre à une réponse ne contourne ni un blocage ni un commentaire du haut qui ne se voit plus", async () => {
  const p = preparerPublication();
  const a = await banc.creerPersonne({ pseudo: "a.detour" });
  const b = await banc.creerPersonne({ pseudo: "b.detour" });
  const c = await banc.creerPersonne({ pseudo: "c.detour" });
  const gerant = await banc.creerPersonne({ pseudo: "gerant.detour" });
  roles.set(`${gerant.compteId}:${p.lieuId}`, "gerant");
  const haut = (await commenter(a, p.id, { texte: "Le fil de A" })).corps.commentaire;
  const reponse = (await commenter(c, p.id, { texte: "C répond", reponseA: haut.id })).corps.commentaire;
  banc.bloquer(a, b);
  assert.equal((await commenter(b, p.id, { texte: "Directement", reponseA: haut.id })).corps.erreur, "commentaire-inconnu");
  assert.equal((await commenter(b, p.id, { texte: "Par la réponse de C", reponseA: reponse.id })).corps.erreur, "commentaire-inconnu", "A a bloqué B");
  assert.equal([...banc.tables.commentaires.values()].filter((x) => x.auteurId === b.compteId).length, 0);
  // Le commentaire du haut masqué par le lieu (ou suspendu) : on ne continue pas son fil
  assert.equal((await gerant.demander("PUT", `/app/commentaires/${haut.id}/masque`)).statut, 200);
  assert.equal((await commenter(c, p.id, { texte: "Encore", reponseA: reponse.id })).corps.erreur, "commentaire-inconnu", "haut masqué par le lieu");
  assert.equal((await gerant.demander("DELETE", `/app/commentaires/${haut.id}/masque`)).statut, 200);
  // « Commentaire supprimé » sans autre état : ses réponses restent ouvertes
  assert.equal((await a.demander("DELETE", `/app/commentaires/${haut.id}`)).statut, 200);
  const encore = await commenter(c, p.id, { texte: "Le fil continue", reponseA: reponse.id });
  assert.deepEqual([encore.statut, encore.corps.commentaire?.reponseA], [201, haut.id]);
});

test("sous une publication qui ne se voit plus : 404 pour modifier, et pour supprimer celui d'un autre ; le sien se supprime", async () => {
  const p = preparerPublication();
  const a = await banc.creerPersonne({ pseudo: "a.cachee" });
  const x = await banc.creerPersonne({ pseudo: "x.cachee" });
  const c = (await commenter(a, p.id, { texte: "Avant le masquage" })).corps.commentaire;
  banc.tables.publications.get(p.id)!.statut = "masquee";
  assert.equal((await lirePublic(p.id)).statut, 404);
  for (const [nom, qui, methode, corps] of [["x", x, "PATCH", { texte: "Pas à moi" }], ["x", x, "DELETE", undefined], ["a", a, "PATCH", { texte: "Modifié" }]] as const) {
    const r = await qui.demander(methode, `/app/commentaires/${c.id}`, corps);
    assert.deepEqual([nom, methode, r.statut, r.corps.erreur], [nom, methode, 404, "commentaire-inconnu"]);
  }
  assert.equal(banc.tables.commentaires.get(Number(c.id))!.texte, "Avant le masquage");
  assert.equal((await a.demander("DELETE", `/app/commentaires/${c.id}`)).statut, 200, "le sien se supprime toujours");
  assert.equal(banc.tables.commentaires.has(Number(c.id)), false);
});

test("pages de 100, les plus récents d'abord, avec un curseur opaque", async () => {
  const p = preparerPublication();
  const a = await banc.creerPersonne({ pseudo: "a.pages" });
  // Écrits directement dans la table (20 commentaires par heure et par compte par la route)
  for (let i = 0; i < 102; i++) {
    const id = prendreId(banc.tables, "commentaires");
    banc.tables.commentaires.set(id, {
      id, publicationId: p.id, auteurId: a.compteId, commeLieuId: null, ecritParId: null, texte: `Commentaire ${i}`, mentions: [], reponseAId: null,
      creeLe: new Date(banc.horloge.maintenant + i * 1000), modifieLe: null, supprimeLe: null, masqueParLieuLe: null, suspenduLe: null, retireLe: null,
    });
  }
  const page1 = (await lirePublic(p.id)).corps;
  assert.equal(page1.commentaires.length, 100);
  assert.equal(page1.commentaires[0].texte, "Commentaire 101");
  assert.equal(page1.total, 102);
  const page2 = (await banc.demander("GET", `${chemin(p.id)}?apres=${encodeURIComponent(page1.suite)}`)).corps;
  assert.deepEqual(page2.commentaires.map((c: { texte: string }) => c.texte), ["Commentaire 1", "Commentaire 0"]);
  assert.equal(page2.suite, null);
  assert.equal((await banc.demander("GET", `${chemin(p.id)}?apres=%%%`)).corps.champ, "apres");
});
