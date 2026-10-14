// Tests des signalements des contenus sociaux (/app/signalements, lot L6) : les 6 cibles, un signalement par personne,
// jamais d'ElementMasque, ce qu'on a signalé caché pour soi, masquage pour tous au premier « choquant » SEULEMENT avec un
// e-mail vérifié, un compte de 7 jours et aucun rejet avant, instantané chiffré qui survit au contenu, contenu invisible en
// 404, signalement sans pseudo. Tout en mémoire (banc de la partie sociale).
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { construireInstantane } from "../src/fonctions/social/construire-instantane.ts";
import { peutMasquerToutDeSuite } from "../src/fonctions/social/peut-masquer-tout-de-suite.ts";
import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

const JOUR = 24 * 60 * 60 * 1000;
let banc: Awaited<ReturnType<typeof creerBancSocial>>;
let numeroPublication = 0;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

const maintenant = () => new Date(banc.horloge.maintenant);
const chiffrement = () => banc.social.dependances.chiffrement!;
const signaler = (p: PersonneDeTest, corps: Record<string, unknown>) => p.demander("POST", "/app/signalements", { precision: null, explication: "", ...corps });
const signalementsDe = (cible: string, cibleId: string) => [...banc.tables.signalements.values()].filter((s) => s.cible === cible && s.cibleId === cibleId);
const lireInstantane = (s: { id: number; instantaneChiffre: string | null }) => JSON.parse(chiffrement().dechiffrerInstantane(s.instantaneChiffre!, s.id));

/** Un compte qui peut masquer tout de suite : e-mail vérifié, 8 jours */
async function creerFiable(pseudo: string) {
  const p = await banc.creerPersonne({ pseudo });
  Object.assign(banc.memoire.comptes.get(p.compteId)!, { emailVerifieLe: banc.horloge.maintenant - 8 * JOUR, creeLe: banc.horloge.maintenant - 8 * JOUR });
  return p;
}

async function preparerCommentaire(auteur: PersonneDeTest, texte = "Un commentaire") {
  numeroPublication += 1;
  banc.tables.lieux.set(500 + numeroPublication, { statut: "publie" });
  banc.tables.publications.set(numeroPublication, { lieuId: 500 + numeroPublication, statut: "publiee" });
  const r = await auteur.demander("POST", `/app/commentaires/publications/${numeroPublication}`, { texte });
  return { id: r.corps.commentaire.id as string, publicationId: numeroPublication, lieuId: 500 + numeroPublication };
}

/** Une conversation (privé ou groupe) avec ses membres, et un message chiffré de `auteur` ; `dans` : une conversation qui existe déjà */
function preparerMessage(auteur: PersonneDeTest, membres: PersonneDeTest[], o: { type?: "prive" | "groupe"; titre?: string; texte?: string; photo?: boolean; dans?: number } = {}) {
  const conversationId = o.dans ?? prendreId(banc.tables, "conversations");
  const type = o.type ?? "prive";
  if (o.dans === undefined) {
    banc.tables.conversations.set(conversationId, {
      id: conversationId, type, clePrive: null, titreChiffre: o.titre ? chiffrement().chiffrerTitre(o.titre, conversationId) : null, emoji: type === "groupe" ? "🍕" : null,
      creeParId: auteur.compteId, version: 3, dernierMessageLe: maintenant(), modifieLe: maintenant(), creeLe: maintenant(),
    });
  }
  for (const m of [auteur, ...membres]) {
    banc.tables.membres.push({ conversationId, compteId: m.compteId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: maintenant() });
  }
  const id = prendreId(banc.tables, "messages");
  const idClient = randomUUID();
  banc.tables.messages.set(id, {
    id, conversationId, auteurId: auteur.compteId, type: o.photo ? "photo" : "texte", idClient,
    texteChiffre: o.photo ? null : chiffrement().chiffrerMessage(o.texte ?? "Salut toi", conversationId, idClient),
    fichier: o.photo ? `${randomUUID()}.bin` : null, typeMime: o.photo ? "image/jpeg" : null, taille: o.photo ? 1234 : null, largeur: null, hauteur: null,
    dureeSecondes: null, mediaExpireLe: o.photo ? new Date(banc.horloge.maintenant + 90 * JOUR) : null, creeLe: maintenant(), supprimeLe: null, suspenduLe: null, retireLe: null,
  });
  return { conversationId, id: String(id) };
}

function preparerListe(auteur: PersonneDeTest, visibilite: "tous" | "bande" = "tous") {
  const id = prendreId(banc.tables, "listes");
  banc.tables.listes.set(id, {
    id, auteurId: auteur.compteId, titre: "Mes pizzas", emoji: "🍕", description: "Les meilleures", visibilite, suspendueLe: null, retireeLe: null,
    creeLe: maintenant(), modifieLe: maintenant(),
  });
  banc.tables.lieuxListes.push({ listeId: id, lieuId: 12, ajouteParId: auteur.compteId, creeLe: maintenant() });
  return String(id);
}

function preparerSortie(organisateur: PersonneDeTest, invites: PersonneDeTest[]) {
  const conversationId = prendreId(banc.tables, "conversations");
  banc.tables.conversations.set(conversationId, {
    id: conversationId, type: "sortie", clePrive: null, titreChiffre: null, emoji: null, creeParId: organisateur.compteId, version: 0,
    dernierMessageLe: maintenant(), modifieLe: maintenant(), creeLe: maintenant(),
  });
  const id = prendreId(banc.tables, "sorties");
  banc.tables.sorties.set(id, {
    id, conversationId, organisateurId: organisateur.compteId, titre: "Pizza du jeudi", emoji: "🍕", quand: new Date(banc.horloge.maintenant + 3 * JOUR),
    finVote: new Date(banc.horloge.maintenant + JOUR), lieuChoisiId: null, voteTermineLe: null, version: 0, modifieLe: maintenant(), creeLe: maintenant(),
  });
  banc.tables.invitationsSorties.push({ sortieId: id, compteId: organisateur.compteId, inviteParId: null, statut: "accepte", creeLe: maintenant(), reponduLe: maintenant() });
  for (const p of invites) banc.tables.invitationsSorties.push({ sortieId: id, compteId: p.compteId, inviteParId: organisateur.compteId, statut: "invite", creeLe: maintenant(), reponduLe: null });
  const propositionId = prendreId(banc.tables, "propositions");
  banc.tables.propositions.set(propositionId, { id: propositionId, sortieId: id, lieuId: 33, proposeParId: organisateur.compteId, creeLe: maintenant() });
  return String(id);
}

test("peutMasquerToutDeSuite : e-mail vérifié, 7 jours au moins, aucun rejet avant", () => {
  const ici = new Date("2026-10-14T10:00:00Z");
  const ilYa = (jours: number) => new Date(ici.getTime() - jours * JOUR);
  assert.equal(peutMasquerToutDeSuite({ emailVerifie: true, creeLe: ilYa(7) }, false, ici), true);
  assert.equal(peutMasquerToutDeSuite({ emailVerifie: false, creeLe: ilYa(30) }, false, ici), false, "e-mail pas vérifié");
  assert.equal(peutMasquerToutDeSuite({ emailVerifie: true, creeLe: ilYa(6) }, false, ici), false, "compte de 6 jours");
  assert.equal(peutMasquerToutDeSuite({ emailVerifie: true, creeLe: ilYa(30) }, true, ici), false, "rejet avant");
});

test("construireInstantane : JSON versionné, textes coupés à leur longueur, lieux par leur id", () => {
  const json = JSON.parse(construireInstantane({
    cible: "message", type: "texte", texte: "é".repeat(600), lieuId: null, illisible: false, media: null,
    conversation: { type: "groupe", titre: "Pizza", emoji: "🍕" }, auteur: { pseudo: "lea", prenom: "Léa" }, date: new Date("2026-10-14T10:00:00Z"),
  }));
  assert.equal(json.v, 1);
  assert.equal(json.texte.length, 500);
  assert.equal(json.date, "2026-10-14T10:00:00.000Z");
  const liste = JSON.parse(construireInstantane({ cible: "liste", titre: "T", emoji: "🍕", description: "", visibilite: "tous", lieux: Array.from({ length: 150 }, (_, i) => i), auteur: null }));
  assert.equal(liste.lieux.length, 100);
});

test("les 6 cibles : 201, instantané chiffré lisible par la modération, auteur du contenu noté ; une seule fois par personne", async () => {
  const moi = await banc.creerPersonne({ pseudo: "moi.cibles" });
  const lea = await banc.creerPersonne({ pseudo: "lea.cibles" });
  banc.rendrePotes(moi, lea);
  const commentaire = await preparerCommentaire(lea, "Texte du commentaire");
  const message = preparerMessage(lea, [moi], { texte: "Texte du message" });
  const groupe = preparerMessage(lea, [moi], { type: "groupe", titre: "Les gourmands" });
  const liste = preparerListe(lea);
  const sortie = preparerSortie(lea, [moi]);
  const cibles = [
    ["commentaire", commentaire.id], ["message", message.id], ["liste", liste], ["profil", lea.idPublic!], ["sortie", sortie], ["groupe", String(groupe.conversationId)],
  ] as const;
  for (const [cible, cibleId] of cibles) {
    const r = await signaler(moi, { cible, cibleId, raison: "haine" });
    assert.deepEqual([cible, r.statut, r.corps], [cible, 201, { ok: true, masquePourTous: false }]);
    const [s] = signalementsDe(cible, cibleId);
    assert.deepEqual([s!.signaleParId, s!.auteurContenuId, s!.source, s!.statut], [moi.compteId, lea.compteId, "app", "a-traiter"]);
    assert.equal(lireInstantane(s!).cible, cible);
    const deja = await signaler(moi, { cible, cibleId, raison: "arnaque" });
    assert.deepEqual([deja.statut, deja.corps], [200, { ok: true, deja: true }]);
  }
  assert.equal(lireInstantane(signalementsDe("commentaire", commentaire.id)[0]!).texte, "Texte du commentaire");
  assert.equal(signalementsDe("commentaire", commentaire.id)[0]!.lieuId, commentaire.lieuId);
  assert.equal(lireInstantane(signalementsDe("message", message.id)[0]!).texte, "Texte du message");
  assert.equal(lireInstantane(signalementsDe("groupe", String(groupe.conversationId))[0]!).titre, "Les gourmands");
  assert.deepEqual(lireInstantane(signalementsDe("liste", liste)[0]!).lieux, [12]);
  assert.deepEqual(lireInstantane(signalementsDe("sortie", sortie)[0]!).lieux, [33]);
  assert.equal(lireInstantane(signalementsDe("profil", lea.idPublic!)[0]!).pseudo, "lea.cibles");
  assert.equal(banc.tables.masques.length, 0, "jamais d'ElementMasque");
  const miens = await moi.demander("GET", "/app/signalements/miens?cible=message");
  assert.deepEqual(miens.corps.cibleIds, [message.id]);
  assert.deepEqual((await moi.demander("GET", `/app/commentaires/publications/${commentaire.publicationId}/moi`)).corps.moi.signales, [commentaire.id]);
  assert.equal((await moi.demander("GET", "/app/signalements/miens?cible=profil")).corps.champ, "cible");
});

test("un groupe se signale dès l'invitation (titre et emoji vus dans « Rejoindre le groupe ? »), pas après un refus", async () => {
  const createur = await banc.creerPersonne({ pseudo: "createur.invite" });
  const invitee = await banc.creerPersonne({ pseudo: "invitee.invite" });
  const refus = await banc.creerPersonne({ pseudo: "refus.invite" });
  const groupe = preparerMessage(createur, [], { type: "groupe", titre: "Un titre insultant" });
  for (const [p, statut] of [[invitee, "invite"], [refus, "refuse"]] as const) {
    banc.tables.invitationsGroupes.push({ conversationId: groupe.conversationId, compteId: p.compteId, inviteParId: createur.compteId, statut, creeLe: maintenant(), reponduLe: null });
  }
  const cibleId = String(groupe.conversationId);
  assert.deepEqual((await signaler(invitee, { cible: "groupe", cibleId, raison: "haine" })).corps, { ok: true, masquePourTous: false });
  const [s] = signalementsDe("groupe", cibleId);
  assert.deepEqual([s!.signaleParId, s!.auteurContenuId], [invitee.compteId, createur.compteId]);
  assert.deepEqual(lireInstantane(s!), { v: 1, cible: "groupe", titre: "Un titre insultant", emoji: "🍕", createur: { pseudo: "createur.invite", prenom: lireInstantane(s!).createur.prenom } });
  assert.equal(banc.tables.membres.some((m) => m.conversationId === groupe.conversationId && m.compteId === invitee.compteId), false, "toujours pas membre");
  assert.equal((await signaler(refus, { cible: "groupe", cibleId, raison: "haine" })).statut, 404, "invitation refusée");
  assert.equal((await signaler(invitee, { cible: "message", cibleId: groupe.id, raison: "haine" })).statut, 404, "les messages restent invisibles");
});

test("une photo signalée garde son fichier pour la modération", async () => {
  const moi = await banc.creerPersonne({ pseudo: "moi.photo" });
  const lea = await banc.creerPersonne({ pseudo: "lea.photo" });
  const photo = preparerMessage(lea, [moi], { photo: true });
  assert.equal((await signaler(moi, { cible: "message", cibleId: photo.id, raison: "vie-privee" })).statut, 201);
  const [s] = signalementsDe("message", photo.id);
  assert.equal(s!.fichierMedia, banc.tables.messages.get(Number(photo.id))!.fichier);
  assert.deepEqual(lireInstantane(s!).media, { typeMime: "image/jpeg", taille: 1234, dureeSecondes: null });
});

test("« choquant » masque pour tous seulement avec un e-mail vérifié, 7 jours et aucun rejet avant ; l'auteur est prévenu", async () => {
  const fiable = await creerFiable("fiable.choquant");
  const jeune = await banc.creerPersonne({ pseudo: "jeune.choquant" });
  Object.assign(banc.memoire.comptes.get(jeune.compteId)!, { emailVerifieLe: banc.horloge.maintenant, creeLe: banc.horloge.maintenant - 6 * JOUR });
  const auteur = await banc.creerPersonne({ pseudo: "auteur.choquant" });
  const c1 = await preparerCommentaire(auteur, "Horrible");
  assert.deepEqual((await signaler(jeune, { cible: "commentaire", cibleId: c1.id, raison: "choquant" })).corps, { ok: true, masquePourTous: false }, "compte de 6 jours");
  assert.equal(banc.tables.commentaires.get(Number(c1.id))!.suspenduLe, null);
  assert.deepEqual((await signaler(fiable, { cible: "commentaire", cibleId: c1.id, raison: "choquant" })).corps, { ok: true, masquePourTous: true });
  assert.ok(banc.tables.commentaires.get(Number(c1.id))!.suspenduLe);
  assert.equal((await banc.demander("GET", `/app/commentaires/publications/${c1.publicationId}`)).corps.total, 0, "masqué pour tout le monde");
  const prevenu = [...banc.tables.cloche.values()].find((l) => l.compteId === auteur.compteId && l.type === "contenu-masque");
  assert.deepEqual([prevenu?.acteurId, prevenu?.detail, prevenu?.cible], [null, "choquant", "signalement"], "sans dire qui a signalé");
  // Un message masqué fait bouger sa discussion (l'app la relit)
  const message = preparerMessage(auteur, [fiable]);
  const version = banc.tables.conversations.get(message.conversationId)!.version;
  assert.equal((await signaler(fiable, { cible: "message", cibleId: message.id, raison: "choquant" })).corps.masquePourTous, true);
  assert.equal(banc.tables.conversations.get(message.conversationId)!.version, version + 1);
  // Un rejet avant sur ce contenu : en tête de file, sans masquer
  const liste = preparerListe(auteur);
  const ancien = await creerFiable("ancien.choquant");
  await signaler(ancien, { cible: "liste", cibleId: liste, raison: "arnaque" });
  Object.assign(signalementsDe("liste", liste)[0]!, { statut: "rejete", traiteLe: maintenant() });
  assert.equal((await signaler(fiable, { cible: "liste", cibleId: liste, raison: "choquant" })).corps.masquePourTous, false);
  assert.equal(banc.tables.listes.get(Number(liste))!.suspendueLe, null);
  // Même après un lieu ajouté (la liste bouge) : « aucun rejet passé sur ce contenu » (Hugo, I.18 a)
  banc.horloge.maintenant += 60_000;
  banc.tables.lieuxListes.push({ listeId: Number(liste), lieuId: 13, ajouteParId: auteur.compteId, creeLe: maintenant() });
  banc.tables.listes.get(Number(liste))!.modifieLe = maintenant();
  const encoreFiable = await creerFiable("encore.choquant");
  assert.deepEqual((await signaler(encoreFiable, { cible: "liste", cibleId: liste, raison: "choquant" })).corps, { ok: true, masquePourTous: false });
  assert.equal(banc.tables.listes.get(Number(liste))!.suspendueLe, null);
  // Pareil pour un commentaire rejeté puis modifié par son auteur
  const c3 = await preparerCommentaire(auteur, "Anodin");
  await signaler(ancien, { cible: "commentaire", cibleId: c3.id, raison: "arnaque" });
  Object.assign(signalementsDe("commentaire", c3.id)[0]!, { statut: "rejete", traiteLe: maintenant() });
  banc.horloge.maintenant += 60_000;
  assert.equal((await auteur.demander("PATCH", `/app/commentaires/${c3.id}`, { texte: "Modifié depuis" })).statut, 200);
  assert.equal((await signaler(encoreFiable, { cible: "commentaire", cibleId: c3.id, raison: "choquant" })).corps.masquePourTous, false);
  assert.equal(banc.tables.commentaires.get(Number(c3.id))!.suspenduLe, null);
  // Jamais pour un profil, une sortie ou un groupe
  assert.equal((await signaler(fiable, { cible: "profil", cibleId: auteur.idPublic, raison: "choquant" })).corps.masquePourTous, false);
  // Sans e-mail vérifié
  const sansEmail = await banc.creerPersonne({ pseudo: "sans.email" });
  banc.memoire.comptes.get(sansEmail.compteId)!.creeLe = banc.horloge.maintenant - 30 * JOUR;
  const c2 = await preparerCommentaire(auteur, "Encore");
  assert.equal((await signaler(sansEmail, { cible: "commentaire", cibleId: c2.id, raison: "choquant" })).corps.masquePourTous, false);
});

test("l'instantané reste quand le contenu change ou disparaît, et quand l'auteur supprime son compte", async () => {
  const moi = await banc.creerPersonne({ pseudo: "moi.preuve" });
  const auteur = await banc.creerPersonne({ pseudo: "auteur.preuve" });
  const c = await preparerCommentaire(auteur, "La preuve");
  await signaler(moi, { cible: "commentaire", cibleId: c.id, raison: "haine" });
  assert.equal((await auteur.demander("PATCH", `/app/commentaires/${c.id}`, { texte: "Tout autre chose" })).statut, 200);
  assert.equal((await auteur.demander("DELETE", `/app/commentaires/${c.id}`)).statut, 200);
  assert.ok(banc.tables.commentaires.get(Number(c.id))!.supprimeLe, "signalement ouvert : « Commentaire supprimé », pas effacé");
  const message = preparerMessage(auteur, [moi], { texte: "Message signalé" });
  await signaler(moi, { cible: "message", cibleId: message.id, raison: "haine" });
  banc.tables.messages.delete(Number(message.id));
  await banc.supprimerCompte(auteur);
  const [sc] = signalementsDe("commentaire", c.id);
  const [sm] = signalementsDe("message", message.id);
  assert.equal(lireInstantane(sc!).texte, "La preuve");
  assert.equal(lireInstantane(sm!).texte, "Message signalé");
  assert.deepEqual([sc!.auteurContenuId, sm!.auteurContenuId, sc!.signaleParId], [null, null, moi.compteId]);
});

test("l'instantané reste après « annuler la sortie » et « supprimer la liste » par leurs routes, discussion de la sortie comprise", async () => {
  const moi = await banc.creerPersonne({ pseudo: "moi.annule" });
  const auteur = await banc.creerPersonne({ pseudo: "auteur.annule" });
  banc.rendrePotes(moi, auteur);
  const sortie = preparerSortie(auteur, [moi]);
  const liste = preparerListe(auteur);
  assert.equal((await moi.demander("POST", `/app/sorties/${sortie}/reponse`, { vient: true })).statut, 200);
  const conversationId = banc.tables.sorties.get(Number(sortie))!.conversationId;
  const message = preparerMessage(auteur, [], { texte: "Rendez-vous chez moi", dans: conversationId });
  for (const [cible, cibleId] of [["sortie", sortie], ["liste", liste], ["message", message.id]] as const) {
    assert.equal((await signaler(moi, { cible, cibleId, raison: "arnaque" })).statut, 201, cible);
  }
  assert.equal((await auteur.demander("DELETE", `/app/sorties/${sortie}`)).statut, 200);
  assert.equal((await auteur.demander("DELETE", `/app/listes/${liste}`)).statut, 200);
  assert.deepEqual([banc.tables.sorties.has(Number(sortie)), banc.tables.conversations.has(conversationId), banc.tables.listes.has(Number(liste))], [false, false, false]);
  assert.equal(banc.tables.messages.has(Number(message.id)), false, "le message part avec la discussion");
  const [ss, sl, sm] = [signalementsDe("sortie", sortie)[0]!, signalementsDe("liste", liste)[0]!, signalementsDe("message", message.id)[0]!];
  assert.deepEqual([lireInstantane(ss).titre, lireInstantane(ss).lieux, lireInstantane(ss).organisateur.pseudo], ["Pizza du jeudi", [33], "auteur.annule"]);
  assert.deepEqual([lireInstantane(sl).titre, lireInstantane(sl).lieux], ["Mes pizzas", [12]]);
  assert.deepEqual([lireInstantane(sm).texte, lireInstantane(sm).conversation.type], ["Rendez-vous chez moi", "sortie"]);
  assert.deepEqual([ss, sl, sm].map((s) => [s.statut, s.auteurContenuId]), [["a-traiter", auteur.compteId], ["a-traiter", auteur.compteId], ["a-traiter", auteur.compteId]]);
});

test("contenu invisible, ou le sien : 404 contenu-inconnu ; signalement mal formé : 400 signalement-invalide", async () => {
  const moi = await banc.creerPersonne({ pseudo: "moi.invisible" });
  const lea = await banc.creerPersonne({ pseudo: "lea.invisible" });
  const autre = await banc.creerPersonne({ pseudo: "autre.invisible" });
  const ailleurs = preparerMessage(lea, [autre]);
  assert.equal((await signaler(moi, { cible: "message", cibleId: ailleurs.id, raison: "haine" })).corps.erreur, "contenu-inconnu", "pas membre");
  const avant = preparerMessage(lea, [moi]);
  banc.tables.membres.find((m) => m.conversationId === avant.conversationId && m.compteId === moi.compteId)!.visibleApres = Number(avant.id);
  assert.equal((await signaler(moi, { cible: "message", cibleId: avant.id, raison: "haine" })).statut, 404, "arrivé après lui");
  assert.equal((await signaler(moi, { cible: "liste", cibleId: preparerListe(lea, "bande"), raison: "haine" })).statut, 404, "liste de sa bande");
  assert.equal((await signaler(moi, { cible: "sortie", cibleId: preparerSortie(lea, [autre]), raison: "haine" })).statut, 404, "pas invité");
  const sien = await preparerCommentaire(moi, "Le mien");
  assert.equal((await signaler(moi, { cible: "commentaire", cibleId: sien.id, raison: "haine" })).statut, 404, "son propre contenu");
  banc.bloquer(lea, moi);
  assert.equal((await signaler(moi, { cible: "profil", cibleId: lea.idPublic, raison: "haine" })).statut, 404, "elle m'a bloqué");
  assert.deepEqual((await signaler(moi, { cible: "publication", cibleId: "1", raison: "haine" })).corps, { ok: false, erreur: "signalement-invalide" });
  assert.equal((await signaler(moi, { cible: "commentaire", cibleId: sien.id, raison: "autre", explication: "court" })).corps.erreur, "signalement-invalide");
});

test("signaler ne demande pas de pseudo (201, aucun profil social créé) ; sans clé des données : 503", async () => {
  const sansPseudo = await banc.creerPersonne({ sansPseudo: true });
  const lea = await banc.creerPersonne({ pseudo: "lea.sans.pseudo" });
  const c = await preparerCommentaire(lea);
  assert.equal((await signaler(sansPseudo, { cible: "commentaire", cibleId: c.id, raison: "haine" })).statut, 201);
  assert.equal(banc.tables.profils.has(sansPseudo.compteId), false);
  const sansCle = await creerBancSocial({ sansCle: true });
  try {
    const p = await sansCle.creerPersonne({ pseudo: "moi.sans.cle" });
    assert.equal((await p.demander("POST", "/app/signalements", { cible: "profil", cibleId: "abcdefghjk", raison: "haine" })).statut, 503);
  } finally {
    await sansCle.fermer();
  }
});
