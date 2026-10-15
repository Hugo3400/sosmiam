// Essai sur base (PGlite, toutes les migrations du dépôt) des versions Prisma des sorties et des listes (lot L5,
// services/sorties.ts et listes.ts) par le VRAI client : créer (clé d'idempotence rejouée, clé prise par autre chose),
// « Tu viens ? », refus gardé, réinvitation, votes (celui d'une personne bloquée compté sans être nommé), propositions (8 au
// plus), non-lus de la discussion, relecture par version, fin des votes par la tâche de la minute (égalité : le premier
// proposé), la main qui passe quand l'organisateur part, le dernier qui part (cascade), retrait, annulation ; listes : bande
// ou tous, co-auteurs (refus gardé 30 jours), à découvrir, abonnements, signalée (cachée pour soi), suppression (cascade) ;
// puis les corrections de la relecture L5 (organisateur supprimé, blocage par qui a la main, vote d'un non-participant,
// cloche sans téléphone à la réinvitation, co-auteur bloqué). Porté du scratchpad (l5-corrections). Aucune vraie base.
import "../socle/garde-fou.ts";
import { randomUUID } from "node:crypto";
import { creerListes } from "../../src/services/listes.ts";
import { creerRelationsSociales } from "../../src/services/relations-sociales.ts";
import { construireRequeteNonLusSorties } from "../../src/services/sorties-lecture.ts";
import { creerSorties } from "../../src/services/sorties.ts";
import { creerStockageMediasChatEnMemoire } from "../../src/services/stockage-medias-chat.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { base } = essai;
const q = essai.sql;
const verifications = creerVerifications();
const { egal, vrai } = verifications;
/** La première colonne de chaque ligne, en nombres (la base d'essai rend du texte) */
const ids = async (sql: string, valeurs: unknown[] = []) => (await q(sql, valeurs)).map((l) => Number(Object.values(l)[0]));
const nombre = async (sql: string, valeurs: unknown[] = []) => (await ids(sql, valeurs))[0];
/** Vérifie (et compte) que le geste a réussi, et le rend réussi pour la suite */
const reussi = <R extends { ok: boolean }>(r: R, message: string) => {
  vrai(r.ok, `${message} : ${JSON.stringify(r)}`);
  return r as Extract<R, { ok: true }>;
};
/** Vérifie (et compte) que la sortie se lit en entier (ni invitation, ni « inchangée », ni rien) */
const enEntier = <L>(lecture: L, message: string) => {
  vrai(lecture !== null && typeof lecture === "object" && "sortie" in lecture, message);
  return lecture as Extract<NonNullable<L>, { sortie: unknown }>;
};

// Six comptes avec profil social ; 1 est pote de 2, 3, 4 et 6 ; 5 est un inconnu
for (let i = 1; i <= 6; i++) {
  await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo) VALUES ($1, $2, 'x', $3, '2026-10-08', $4)`, [i, `essai${i}@exemple.fr`, `Prenom${i}`, `essai.${i}`]);
  await q(`INSERT INTO profils_sociaux (compte_id, id_public) VALUES ($1, $2)`, [i, `essai${"abcdefghjk"[i]}xyzw`]);
}
for (const pote of [2, 3, 4, 6]) await q(`INSERT INTO membres_bandes (compte_id, pote_id) VALUES (1, $1), ($1, 1)`, [pote]);
for (let i = 1; i <= 12; i++) {
  await q(`INSERT INTO lieux (id, nom, type, emoji, info, texte, quartier, ville, prix, horaires, plat, statut) VALUES ($1, $2, 'resto', '🍽️', '', '', '', 'Nantes', '€', '', '', $3)`,
    [i, `Le Bouiboui n°${i}`, i === 12 ? "brouillon" : "publie"]);
}

const relations = creerRelationsSociales(base);
const medias = creerStockageMediasChatEnMemoire({ partLibre: 0.5 });
const sorties = creerSorties({ relations, medias, base });
const listes = creerListes({ relations, base });
let maintenant = new Date("2026-10-14T10:00:00Z");
const plus = (ms: number) => new Date(maintenant.getTime() + ms);
const H = 60 * 60_000;

// ── Sorties ──
const cle = randomUUID();
const nouvelle = { titre: "Pizza du jeudi", emoji: "🍕", quand: plus(3 * H), finVote: plus(H), invites: [2, 3, 4], lieux: [1, 2] };
egal(await sorties.creer(1, { ...nouvelle, invites: [2, 5] }, randomUUID(), maintenant), { ok: false, erreur: "pas-dans-la-bande" });
egal(await sorties.creer(1, { ...nouvelle, lieux: [1, 12] }, randomUUID(), maintenant), { ok: false, erreur: "lieu-inconnu" });
const creee = reussi(await sorties.creer(1, nouvelle, cle, maintenant), "sortie créée");
vrai(creee.cree);
const id = Number(creee.sortie.id);
egal(creee.effets.flatMap((e) => (e.quoi === "cloche" ? [e.notification.compteId] : [])), [2, 3, 4]);
egal(creee.effets.flatMap((e) => (e.quoi === "push" ? [e.compteId] : [])), [2, 3, 4]);
const rejouee = await sorties.creer(1, nouvelle, cle, maintenant);
vrai(rejouee.ok && !rejouee.cree && rejouee.sortie.id === creee.sortie.id && rejouee.effets.length === 0, "même clé : la même sortie, sans effets");
egal(await nombre(`SELECT count(*) FROM sorties`), 1, "une seule sortie pour une même clé");
// Clé déjà prise par autre chose (une liste)
const clePrise = randomUUID();
await q(`INSERT INTO cles_idempotence (compte_id, cle, ressource, ressource_id) VALUES (1, $1, 'liste', 99)`, [clePrise]);
egal(await sorties.creer(1, nouvelle, clePrise, maintenant), { ok: false, erreur: "cle-deja-prise" });

const invitation = await sorties.lire(2, id, null, maintenant);
vrai(invitation && "invitation" in invitation && invitation.invitation.participants === 1, "« Tu viens ? » : rien d'autre avant d'accepter");
egal(await sorties.lire(5, id, null, maintenant), null);
const oui = await sorties.repondre(2, id, true, maintenant);
vrai(oui.ok && oui.sortie && oui.sortie.participants.length === 2 && oui.sortie.version === 1);
egal(await ids(`SELECT compte_id FROM membres_conversations ORDER BY compte_id`), [1, 2]);
egal(await nombre(`SELECT version FROM conversations`), 1, "un membre de plus : la conversation bouge aussi");
egal(await sorties.repondre(3, id, false, maintenant), { ok: true, sortie: null });
const reinvite = reussi(await sorties.inviter(1, id, [3, 6], maintenant), "réinvitation faite");
egal(reinvite.effets.flatMap((e) => (e.quoi === "cloche" ? [e.notification.compteId] : [])), [6], "le refus est sauté, sans le dire");
egal(await sorties.inviter(2, id, [6], maintenant), { ok: false, erreur: "reserve-a-l-organisateur" });
egal(await sorties.terminerVote(5, id, maintenant), { ok: false, erreur: "sortie-inconnue" });

// Votes, propositions, blocage
await q(`INSERT INTO blocages (bloqueur_id, bloque_id) VALUES (2, 1)`);
vrai((await sorties.voter(2, id, 2, true, maintenant)).ok);
const vuParOrga = enEntier(await sorties.lire(1, id, null, maintenant), "l'organisateur lit sa sortie en entier");
const deux = vuParOrga.sortie.propositions.find((p) => p.lieuId === 2)!;
egal([deux.nombreVotes, deux.votes.length], [2, 1], "le vote d'une personne bloquée compte, sans être nommé");
await q(`DELETE FROM blocages`);
const proposee = await sorties.proposer(2, id, 3, maintenant);
vrai(proposee.ok && !proposee.deja);
vrai((await sorties.proposer(1, id, 3, maintenant)).ok);
egal(await sorties.proposer(2, id, 12, maintenant), { ok: false, erreur: "lieu-inconnu" });
for (const lieu of [4, 5, 6, 7, 8]) vrai((await sorties.proposer(2, id, lieu, maintenant)).ok, `proposition ${lieu}`);
egal(await sorties.proposer(2, id, 9, maintenant), { ok: false, erreur: "max-propositions" });
vrai((await sorties.voter(2, id, 2, false, maintenant)).ok);

// Non-lus : la requête de la discussion, avec la règle du pouls
const conversationId = await nombre(`SELECT conversation_id FROM sorties WHERE id = $1`, [id]);
await q(`INSERT INTO messages_conversations (conversation_id, auteur_id, type, id_client) VALUES ($1, 2, 'texte', 'a'), ($1, 2, 'texte', 'b'), ($1, 1, 'texte', 'c')`, [conversationId]);
egal(await base.$queryRaw(construireRequeteNonLusSorties(1, [conversationId!])), [{ conversationId, nonLus: 2 }]);
const lue = enEntier(await sorties.lire(1, id, null, maintenant), "la sortie se lit en entier");
egal(lue.sortie.nonLus, 2);
egal(await sorties.lire(1, id, lue.sortie.version, maintenant), { inchange: true, version: lue.sortie.version });

// Fin des votes : par la tâche de la minute
maintenant = plus(61 * 60_000);
egal(await sorties.voter(2, id, 1, true, maintenant), { ok: false, erreur: "vote-termine" });
const fin = await sorties.terminerVotesEchus(maintenant);
egal(fin.terminees, 1);
egal(fin.effets.flatMap((e) => (e.quoi === "cloche" ? [[e.notification.compteId, e.notification.type, e.notification.acteurId]] : [])),
  [[1, "sortie-lieu-choisi", null], [2, "sortie-lieu-choisi", null]]);
egal(await nombre(`SELECT lieu_choisi_id FROM sorties WHERE id = $1`, [id]), 1, "tous à égalité : le premier proposé");
egal((await sorties.terminerVotesEchus(maintenant)).terminees, 0);

// L'organisateur part, puis le dernier : la sortie et sa discussion sont effacées (cascade)
await sorties.quitter(1, id, maintenant);
egal(await nombre(`SELECT organisateur_id FROM sorties WHERE id = $1`, [id]), 2, "la main passe au plus ancien participant");
await sorties.quitter(2, id, maintenant);
egal(await nombre(`SELECT count(*) FROM sorties`), 0);
egal(await nombre(`SELECT count(*) FROM conversations`), 0);
egal(await nombre(`SELECT count(*) FROM messages_conversations`), 0);

// Retrait par l'organisateur (invitation, adhésion et votes effacés), « non » après « oui » (quitter)
const trois = reussi(await sorties.creer(1, { ...nouvelle, quand: plus(3 * H), finVote: plus(H) }, randomUUID(), maintenant), "sortie créée (pour le retrait)");
const tid = Number(trois.sortie.id);
for (const p of [2, 3]) vrai((await sorties.repondre(p, tid, true, maintenant)).ok, `${p} vient`);
vrai((await sorties.voter(3, tid, 2, true, maintenant)).ok);
egal(await sorties.retirerParticipant(1, tid, 3, maintenant), { ok: true });
egal(await nombre(`SELECT count(*) FROM votes_sorties v JOIN propositions_sorties p ON p.id = v.proposition_id WHERE p.sortie_id = $1 AND v.compte_id = 3`, [tid]), 0);
egal(await nombre(`SELECT count(*) FROM membres_conversations m JOIN sorties s ON s.conversation_id = m.conversation_id WHERE s.id = $1 AND m.compte_id = 3`, [tid]), 0);
egal(await sorties.retirerParticipant(1, tid, 5, maintenant), { ok: false, erreur: "personne-inconnue" });
egal(await sorties.repondre(2, tid, false, maintenant), { ok: true, sortie: null });
egal(await sorties.lire(2, tid, null, maintenant), null, "« non » après « oui » : il a quitté");
vrai((await sorties.annuler(1, tid)).ok);

// Annulation et liste
const autre = reussi(await sorties.creer(1, { ...nouvelle, quand: plus(3 * H), finVote: plus(H) }, randomUUID(), maintenant), "sortie créée (pour l'annulation)");
const liste = await sorties.lister(4, maintenant);
egal([liste.sorties.length, liste.invitations.map((i) => i.id)], [0, [autre.sortie.id]]);
const annulee = reussi(await sorties.annuler(1, Number(autre.sortie.id)), "sortie annulée");
egal(annulee.effets.map((e) => e.quoi === "cloche" && e.notification.type), ["sortie-annulee", "sortie-annulee", "sortie-annulee"]);

// ── Listes ──
await q(`UPDATE comptes SET prive = true WHERE id = 6`);
const l = reussi(await listes.creer(1, { titre: "Brunchs", emoji: "🥞", description: "", visibilite: "bande" }, randomUUID(), maintenant), "liste « bande » créée");
const lid = Number(l.liste.id);
egal(await listes.lire(5, lid), null, "« bande » : pas pour un inconnu");
vrai(await listes.lire(2, lid));
egal(await listes.modifier(2, lid, { titre: "À moi" }, maintenant), { ok: false, erreur: "reserve-a-l-auteur" });
egal(await listes.modifier(5, lid, { titre: "À moi" }, maintenant), { ok: false, erreur: "liste-inconnue" });
for (const lieu of [1, 2]) vrai((await listes.basculerLieu(1, lid, lieu, true, plus(lieu * 1000))).ok, `lieu ${lieu} ajouté`);
egal(await listes.basculerLieu(1, lid, 12, true, maintenant), { ok: false, erreur: "lieu-inconnu" });
const invite = await listes.inviterCoAuteur(1, lid, 2, maintenant);
vrai(invite.ok && invite.effets.length === 1);
egal(await listes.inviterCoAuteur(1, lid, 5, maintenant), { ok: false, erreur: "pas-dans-la-bande" });
const acceptee = await listes.accepterCoAuteur(2, lid, maintenant);
vrai(acceptee.ok && acceptee.liste.moi.peutRemplir);
vrai((await listes.basculerLieu(2, lid, 3, true, plus(5000))).ok);
egal(await listes.basculerLieu(2, lid, 1, false, maintenant), { ok: false, erreur: "reserve-a-l-auteur" });
egal((await listes.lire(2, lid))?.lieux, [3, 2, 1]);
vrai((await listes.retirerCoAuteur(1, lid, 2, maintenant)).ok);
egal(await listes.basculerLieu(2, lid, 4, true, maintenant), { ok: false, erreur: "reserve-a-l-auteur" });
await listes.inviterCoAuteur(1, lid, 3, maintenant);
await listes.retirerCoAuteur(3, lid, "moi", maintenant);
const encore = await listes.inviterCoAuteur(1, lid, 3, maintenant);
vrai(encore.ok && encore.effets.length === 0, "refus gardé 30 jours");
const plusTard = await listes.inviterCoAuteur(1, lid, 3, plus(31 * 24 * H));
vrai(plusTard.ok && plusTard.effets.length === 1);
// À découvrir : la bande et les listes « tous » des personnes suivies
const tous = reussi(await listes.creer(6, { titre: "Mes adresses", emoji: "🍜", description: "", visibilite: "tous" }, randomUUID(), plus(1000)), "liste « tous » créée");
await q(`INSERT INTO suivis_personnes (suiveur_id, suivi_id, statut) VALUES (5, 6, 'accepte')`);
egal((await listes.listerADecouvrir(5, null)).listes.map((x) => x.id), [tous.liste.id]);
egal((await listes.listerADecouvrir(2, null)).listes.map((x) => x.id), [l.liste.id]);
await q(`INSERT INTO elements_masques (compte_id, cible, cible_id) VALUES (2, 'liste', $1)`, [String(lid)]);
egal((await listes.listerADecouvrir(2, null)).listes, []);
vrai((await listes.basculerAbonnement(5, Number(tous.liste.id), true, maintenant)).ok);
egal((await listes.listerMiennes(5)).suivies.map((x) => x.id), [tous.liste.id]);
egal(await listes.basculerAbonnement(6, Number(tous.liste.id), true, maintenant), { ok: false, erreur: "champ-invalide" });
await q(`INSERT INTO signalements (cible, cible_id, raison, source, signale_par_id) VALUES ('liste', $1, 'haine', 'app', 5)`, [tous.liste.id]);
egal(await listes.lire(5, Number(tous.liste.id)), null, "signalée : cachée pour soi");
egal((await listes.listerMiennes(5)).suivies, []);
vrai((await listes.supprimer(1, lid)).ok);
egal(await nombre(`SELECT count(*) FROM lieux_listes`), 0, "cascade");

// ── Corrections de la relecture (lot L5) ──
for (let i = 7; i <= 10; i++) {
  await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo) VALUES ($1, $2, 'x', $3, '2026-10-08', $4)`, [i, `essai${i}@exemple.fr`, `Prenom${i}`, `essai.${i}`]);
  await q(`INSERT INTO profils_sociaux (compte_id, id_public) VALUES ($1, $2)`, [i, `essai${i}qrstuv`.slice(0, 10)]);
}
for (const [a, b] of [[7, 8], [7, 9], [7, 10], [8, 10]]) await q(`INSERT INTO membres_bandes (compte_id, pote_id) VALUES ($1, $2), ($2, $1)`, [a, b]);
const s2 = reussi(await sorties.creer(7, { ...nouvelle, invites: [8, 9, 10], quand: plus(3 * H), finVote: plus(H) }, randomUUID(), maintenant), "sortie de 7 créée");
const sid = Number(s2.sortie.id);
vrai((await sorties.repondre(8, sid, true, maintenant)).ok);
vrai((await sorties.repondre(10, sid, true, plus(1000))).ok);
await q(`DELETE FROM comptes WHERE id = 7`);
egal((await q(`SELECT organisateur_id FROM sorties WHERE id = $1`, [sid]))[0]!.organisateur_id, null, "organisateur supprimé : la colonne est vide");
// 8 a la main ; 8 bloque 9 (la colonne est vide : le blocage ne retrouve pas la sortie, l'invitation de 9 reste en base)
await q(`INSERT INTO blocages (bloqueur_id, bloque_id) VALUES (8, 9)`);
egal((await sorties.lister(9, maintenant)).invitations, [], "invitation cachée");
egal(await sorties.lire(9, sid, null, maintenant), null);
egal(await sorties.repondre(9, sid, true, maintenant), { ok: false, erreur: "sortie-inconnue" });
egal(await nombre(`SELECT count(*) FROM invitations_sorties WHERE sortie_id = $1 AND compte_id = 9`, [sid]), 0, "effacée");
egal(await nombre(`SELECT count(*) FROM membres_conversations m JOIN sorties s ON s.conversation_id = m.conversation_id WHERE s.id = $1 AND m.compte_id = 9`, [sid]), 0);
egal(await nombre(`SELECT organisateur_id FROM sorties WHERE id = $1`, [sid]), 8, "le geste a écrit l'organisateur qui a la main");
// Personne inconnue : seulement après la sortie et l'organisateur
egal(await sorties.retirerParticipant(8, 999999, null, maintenant), { ok: false, erreur: "sortie-inconnue" });
egal(await sorties.retirerParticipant(10, sid, null, maintenant), { ok: false, erreur: "reserve-a-l-organisateur" });
egal(await sorties.retirerParticipant(8, sid, null, maintenant), { ok: false, erreur: "personne-inconnue" });
// Le vote d'un non-participant (un reste) ne compte pas
await q(`INSERT INTO votes_sorties (proposition_id, compte_id) SELECT id, 9 FROM propositions_sorties WHERE sortie_id = $1 AND lieu_id = 2`, [sid]);
const vue2 = enEntier(await sorties.lire(8, sid, null, maintenant), "la sortie se lit en entier");
egal(vue2.sortie.propositions.find((p) => p.lieuId === 2)!.nombreVotes, 0);
vrai((await sorties.voter(10, sid, 2, true, maintenant)).ok);
vrai((await sorties.proposer(10, sid, 3, maintenant)).ok);
// Retirer puis réinviter : la cloche, pas le téléphone (déjà sonné pour cette sortie à la création)
egal(await sorties.retirerParticipant(8, sid, 10, maintenant), { ok: true });
const re = reussi(await sorties.inviter(8, sid, [10], maintenant), "réinvitation faite");
egal(re.effets.map((e) => e.quoi), ["cloche"]);
egal(await sorties.retirerParticipant(8, sid, 10, plus(25 * H)), { ok: true });
vrai((await sorties.terminerVote(8, sid, maintenant)).ok);
vrai((await sorties.annuler(8, sid)).ok);
// Co-auteur : les deux comptes verrouillés avant la liste
const l2 = reussi(await listes.creer(8, { titre: "Ramens", emoji: "🍜", description: "", visibilite: "bande" }, randomUUID(), maintenant), "liste de 8 créée");
const co = await listes.inviterCoAuteur(8, Number(l2.liste.id), 10, maintenant);
vrai(co.ok && co.effets.length === 1);
await q(`INSERT INTO blocages (bloqueur_id, bloque_id) VALUES (10, 8)`);
egal(await listes.inviterCoAuteur(8, Number(l2.liste.id), 10, maintenant), { ok: false, erreur: "pas-dans-la-bande" });
await terminerEssai(import.meta.url, essai, verifications.nombre);
