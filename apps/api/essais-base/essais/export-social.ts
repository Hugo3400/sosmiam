// Essai sur base (PGlite, toutes les migrations du dépôt) de l'export « Télécharger mes données sociales », version Prisma
// (services/export-social.ts) : chaque requête sur une vraie base PostgreSQL, et ce qui sort (tes messages déchiffrés, jamais
// ceux des autres ni ton code ; personne qu'un blocage te cache, même après un changement de pseudo ; le titre d'une liste
// seulement si elle t'est visible ; tes suivis avec leur statut ; ce que tu as écrit en signalant ; une sortie quittée
// n'y est plus, « organisateur » : qui a la main ; les limitations de ton compte, lues par le service de la session Site sur
// la même base). Même montage que menage-social.ts. Aucune vraie base.
import "../socle/garde-fou.ts";
import { randomBytes, randomUUID } from "node:crypto";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import { creerExportSocial } from "../../src/services/export-social.ts";
import { creerRelationsSociales } from "../../src/services/relations-sociales.ts";
import { creerSorties } from "../../src/services/sorties.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { base } = essai;
const verifications = creerVerifications();
const { egal } = verifications;
const q = essai.sql;
const T = new Date("2027-03-01T10:00:00Z");
const il = (minutes: number) => new Date(T.getTime() - minutes * 60_000).toISOString();

const chiffrement = creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32)))!;
for (let id = 1; id <= 4; id++) {
  await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo) VALUES ($1, $2, 'x', $3, '2026-10-08', $4)`, [id, `c${id}@exemple.fr`, `P${id}`, `pseudo.${id}`]);
  if (id < 4) await q(`INSERT INTO profils_sociaux (compte_id, id_public, code_invitation_chiffre, cree_le) VALUES ($1, $2, $3, $4)`, [id, `idpublic${"abcd"[id - 1]}k`, chiffrement.chiffrerCode("CODESECRET23", id), il(999)]);
}
// Le compte 5 : un profil social, il a refusé (en silence) que 1 le suive ; le compte 4 est privé
await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo) VALUES (5, 'c5@exemple.fr', 'x', 'P5', '2026-10-08', 'pseudo.5')`);
await q(`INSERT INTO profils_sociaux (compte_id, id_public, cree_le) VALUES (5, 'idpublicek', $1)`, [il(999)]);
await q(`UPDATE comptes SET prive = true WHERE id = 4`);
await q(`INSERT INTO membres_bandes (compte_id, pote_id, cree_le) VALUES (1, 2, $1), (2, 1, $1), (1, 3, $2), (3, 1, $2)`, [il(500), il(400)]);
await q(`INSERT INTO demandes_bandes (de_id, a_id, refusee_le) VALUES (4, 1, now()), (2, 3, NULL)`);
await q(`INSERT INTO blocages (bloqueur_id, bloque_id) VALUES (3, 1)`);
await q(`INSERT INTO suivis_personnes (suiveur_id, suivi_id, statut, cree_le, accepte_le) VALUES (1, 2, 'accepte', $2, $1), (3, 1, 'accepte', $2, $1), (2, 1, 'demande', $2, NULL), (1, 5, 'refuse', $3, NULL)`, [il(300), il(310), il(305)]);
// Un privé 1-2, un groupe chiffré (1, 2), un groupe quitté par 1 (ses messages y restent), une invitation pour 3
await q(`INSERT INTO conversations (id, type, cle_prive) VALUES (1, 'prive', '1-2')`);
await q(`INSERT INTO conversations (id, type, titre_chiffre) VALUES (2, 'groupe', $1), (3, 'groupe', $2)`, [chiffrement.chiffrerTitre("Les Miamis", 2), chiffrement.chiffrerTitre("Ancien groupe", 3)]);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id, arrive_le) VALUES (1, 1, $1), (1, 2, $2), (2, 1, $1), (2, 2, $2), (3, 2, $1)`, [il(200), il(199)]);
await q(`INSERT INTO invitations_groupes (conversation_id, compte_id, invite_par_id, statut) VALUES (2, 3, 1, 'refuse')`);
// Un privé 1-3 (3 a bloqué 1 depuis : il changera de pseudo), deux invitations en attente pour 1 : de 2, et de 3 (bloqué)
await q(`INSERT INTO conversations (id, type, cle_prive) VALUES (4, 'prive', '1-3')`);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id, arrive_le) VALUES (4, 1, $1), (4, 3, $2)`, [il(200), il(199)]);
await q(`INSERT INTO conversations (id, type, titre_chiffre) VALUES (7, 'groupe', $1), (8, 'groupe', $2)`, [chiffrement.chiffrerTitre("Invitation en attente", 7), chiffrement.chiffrerTitre("Club caché", 8)]);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id) VALUES (7, 2), (8, 3)`);
await q(`INSERT INTO invitations_groupes (conversation_id, compte_id, invite_par_id, statut, cree_le) VALUES (7, 1, 2, 'invite', $1), (8, 1, 3, 'invite', $2)`, [il(60), il(50)]);
const message = async (id: number, conversation: number, auteur: number, type: string, clair: string | null, minutes: number, taille: number | null = null) => {
  const idClient = randomUUID();
  await q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, texte_chiffre, taille, cree_le) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, conversation, auteur, type, idClient, clair === null ? null : chiffrement.chiffrerMessage(clair, conversation, idClient), taille, il(minutes)]);
};
await message(11, 1, 1, "texte", "Coucou Malo", 100);
await message(12, 1, 2, "texte", "Secret de Malo", 99);
await message(13, 1, 1, "lieu", JSON.stringify({ l: 7, m: "Le meilleur kebab" }), 98);
await message(14, 1, 1, "photo", null, 97, 4321);
await message(21, 2, 1, "texte", "Bienvenue la Brigade", 90);
await message(31, 3, 1, "texte", "Je pars bientôt", 80);
await message(41, 4, 1, "texte", "Avant le blocage", 70);
await message(42, 4, 3, "texte", "Réponse de 3", 69);
await q(`INSERT INTO reactions_messages (message_id, compte_id, reaction) VALUES (12, 1, 'coeur')`);
await base.lieu.create({ data: {
  id: 7, nom: "Chez Léa", type: "resto", emoji: "🍝", info: "i", texte: "t", quartier: "q", ville: "Nantes", prix: "€", couleurs: [], horaires: "h", plat: "p", tags: [], envies: [], statut: "publie",
} as never });
await base.publication.create({ data: { id: 1, lieuId: 7, auteurType: "createur", auteurPseudo: "lea.mange", legende: "Pâtes", statut: "publiee" } as never });
await q(`INSERT INTO conversations (id, type) VALUES (5, 'sortie'), (6, 'sortie')`);
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote) VALUES (50, 5, 1, 'Mon resto', '🍝', $1, $1), (60, 6, 2, 'Refusée', '🍻', $2, $2)`, [il(-600), il(-700)]);
await q(`INSERT INTO invitations_sorties (sortie_id, compte_id, statut) VALUES (50, 1, 'accepte'), (60, 1, 'refuse')`);
// Trois invitations en attente : de 3 (bloqué), d'une sortie sans organisateur où 3 a la main, et de 2 (visible)
await q(`INSERT INTO conversations (id, type) VALUES (9, 'sortie'), (10, 'sortie'), (11, 'sortie')`);
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote) VALUES (70, 9, 3, 'Chez 3', '🍕', $1, $1), (80, 10, NULL, 'Sans organisateur', '🍕', $2, $2), (90, 11, 2, 'Chez 2', '🍕', $3, $3)`, [il(-800), il(-900), il(-1000)]);
await q(`INSERT INTO invitations_sorties (sortie_id, compte_id, invite_par_id, statut, cree_le, repondu_le) VALUES (70, 3, NULL, 'accepte', $1, NULL), (70, 1, 3, 'invite', $2, NULL), (80, 3, NULL, 'accepte', $1, $2), (80, 1, NULL, 'invite', $2, NULL), (90, 2, NULL, 'accepte', $1, NULL), (90, 1, 2, 'invite', $2, NULL)`, [il(500), il(400)]);
await q(`INSERT INTO propositions_sorties (id, sortie_id, lieu_id, propose_par_id) VALUES (500, 50, 7, 1)`);
await q(`INSERT INTO votes_sorties (proposition_id, compte_id) VALUES (500, 1)`);
await q(`INSERT INTO listes_lieux (id, auteur_id, titre, emoji) VALUES (1, 1, 'Mes kebabs', '🥙'), (2, 2, 'Ensemble', '📋'), (3, 2, 'Suivie', '👀')`);
// Des listes suivies qui ne te sont plus visibles : de qui t'a bloqué, suspendue, signalée par toi, d'un compte privé ; une
// liste « bande » de ton pote reste visible
await q(`INSERT INTO listes_lieux (id, auteur_id, titre, emoji, visibilite, suspendue_le) VALUES (4, 3, 'De 3', '📋', 'tous', NULL), (5, 2, 'Suspendue', '📋', 'tous', now()), (6, 2, 'Pour la bande', '📋', 'bande', NULL), (7, 2, 'Signalée', '📋', 'tous', NULL), (9, 4, 'Compte privé', '📋', 'tous', NULL)`);
await q(`INSERT INTO abonnements_listes (liste_id, compte_id) VALUES (4, 1), (5, 1), (6, 1), (7, 1), (9, 1)`);
await q(`INSERT INTO lieux_listes (liste_id, lieu_id, ajoute_par_id) VALUES (1, 7, 1), (2, 7, 2), (3, 7, 2)`);
await q(`INSERT INTO co_auteurs_listes (liste_id, compte_id, statut) VALUES (2, 1, 'accepte')`);
await q(`INSERT INTO abonnements_listes (liste_id, compte_id) VALUES (3, 1)`);
await q(`INSERT INTO commentaires_publications (id, publication_id, auteur_id, texte) VALUES (1, 1, 1, 'Trop bon'), (2, 1, 2, 'Pas à moi')`);
await q(`INSERT INTO jaimes_commentaires (commentaire_id, compte_id) VALUES (2, 1)`);
await q(`INSERT INTO notifications_cloche (compte_id, type, acteur_id) VALUES (1, 'mention', 2), (2, 'mention', 1)`);
await q(`INSERT INTO signalements (cible, cible_id, raison, precision, explication, source, statut, decision, motivation, contestation, instantane_chiffre, signale_par_id)
  VALUES ('message', '12', 'haine', 'Insultes', 'Il m''a insulté', 'app', 'retenu', 'Note privée', 'Pour l''auteur', 'Je conteste', 'v1:instantane-secret', 1)`);
await q(`INSERT INTO signalements (cible, cible_id, raison, source, signale_par_id) VALUES ('publication', '1', 'faux-lieu', 'app', 1), ('liste', '7', 'arnaque', 'app', 1)`);
await q(`INSERT INTO elements_masques (compte_id, cible, cible_id) VALUES (1, 'liste', '3')`);
// Deux sorties créées par 1 où 2 participe : 1 quittera la première par le vrai service ; la seconde garde 1 dans la colonne
// sans son invitation (ligne d'avant l'alignement, ou un geste qui n'appelle pas marquer)
await q(`INSERT INTO conversations (id, type) VALUES (12, 'sortie'), (13, 'sortie')`);
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote) VALUES (110, 12, 1, 'Quittée par 1', '🍕', $1, $1), (120, 13, 1, 'Colonne pas réalignée', '🍕', $2, $2)`, [il(-1100), il(-1200)]);
await q(`INSERT INTO invitations_sorties (sortie_id, compte_id, invite_par_id, statut, cree_le, repondu_le) VALUES (110, 1, NULL, 'accepte', $1, NULL), (110, 2, 1, 'accepte', $2, $3), (120, 2, 1, 'accepte', $2, $3)`, [il(500), il(450), il(440)]);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id) VALUES (12, 1), (12, 2), (13, 2)`);
// Les limitations de 1 (une levée avant sa fin ; une en cours, contestée puis réexaminée) et une de 2
await q(`INSERT INTO limitations_comptes (compte_id, motif, motivation, debut, fin, levee_le, contestation, conteste_le, reexamine_le, cree_le) VALUES
  (1, 'pub-cachee', 'Des liens de pub dans tes commentaires', $1, $2, $3, NULL, NULL, NULL, $4),
  (1, 'haine', 'Des insultes répétées dans une discussion', $5, NULL, NULL, 'Je n''ai insulté personne', $6, $7, $5),
  (2, 'arnaque', 'Motivation pour le compte 2', $7, NULL, NULL, NULL, NULL, NULL, $7)`, [il(20000), il(5000), il(10000), il(20100), il(1000), il(500), il(100)]);

const relations = creerRelationsSociales(base);
const service = creerExportSocial({ relations, chiffrement, base });
// 1 quitte la sortie 110 par le vrai service : 2 y reste, quitter réaligne la colonne sur lui (les médias ne servent pas ici)
await creerSorties({ relations, medias: {} as never, base }).quitter(1, 110, T);
egal(Number((await q(`SELECT organisateur_id FROM sorties WHERE id = 110`))[0]!.organisateur_id), 2, "quitter passe la main (et la colonne) à 2");
egal(Number((await q(`SELECT count(*) AS n FROM invitations_sorties WHERE sortie_id = 110 AND compte_id = 1`))[0]!.n), 0, "plus d'invitation pour 1");
// 3 a bloqué 1 ; il change ensuite de pseudo : ni l'ancien ni le nouveau ne sortent de l'export de 1
await q(`UPDATE comptes SET pseudo = 'pseudo.nouveau' WHERE id = 3`);
const e = await service.exporter(1, T);
egal([e.genereLe, e.profil?.personne.id, e.profil?.creeLe], [T.toISOString(), "idpublicak", il(999)]);
egal(e.bande.map((b) => b.personne.pseudo), ["pseudo.2"], "bande, de la plus ancienne, sans qui m'a bloqué (3)");
egal([e.demandesBande.envoyees, e.demandesBande.recues.map((d) => d.personne.pseudo)], [[], []], "la demande refusée du compte 4 (sans profil) n'y est pas ; celle de 2 vers 3 non plus");
egal(e.bloques, [], "3 m'a bloqué : je ne le sais pas");
egal(e.suivis.abonnements.map((s) => [s.personne.pseudo, s.statut, s.depuis]), [["pseudo.2", "suivi", il(300)], ["pseudo.5", "demande", il(305)]],
  "de la plus ancienne ; suivi : depuis l'acceptation ; le refus silencieux de 5 se lit « demande », depuis la demande");
egal([e.suivis.abonnes.map((s) => s.personne.pseudo), e.suivis.demandesRecues.map((s) => [s.personne.pseudo, s.depuis])], [[], [["pseudo.2", il(310)]]],
  "3 (qui m'a bloqué) n'est pas nommé ; la demande en attente de 2");
egal(e.conversations.map((c) => [c.id, c.type, c.titre, c.membres]), [
  ["1", "prive", null, ["pseudo.1", "pseudo.2"]], ["2", "groupe", "Les Miamis", ["pseudo.1", "pseudo.2"]], ["3", "groupe", null, []], ["4", "prive", null, ["pseudo.1"]],
], "le groupe quitté : ni titre ni membres ; le privé avec 3 : moi seul");
egal(e.conversations[0]!.messages.map((m) => [m.type, m.texte, m.lieuId, m.taille]), [["texte", "Coucou Malo", null, null], ["lieu", "Le meilleur kebab", 7, null], ["photo", null, null, 4321]]);
egal([e.conversations[2]!.messages.map((m) => m.texte), e.conversations[3]!.messages.map((m) => m.texte)], [["Je pars bientôt"], ["Avant le blocage"]]);
egal(e.invitationsGroupes.map((i) => [i.titre, i.statut]), [["Invitation en attente", "invite"], [null, "invite"]], "celle de 3 : sans son titre");
egal(e.reactions.map((r) => [r.messageId, r.reaction]), [["12", "coeur"]]);
egal(e.sorties.map((s) => [s.titre, s.role, s.propositions, s.votes]), [["Mon resto", "organisateur", [7], [7]], ["Chez 2", "invite", [], []]],
  "ni l'invitation de 3, ni celle de la sortie où 3 a la main");
egal(e.listes.map((l) => [l.titre, l.role, l.lieux]), [
  ["Mes kebabs", "auteur", [7]], ["Ensemble", "co-auteur", []], ["Suivie", "abonne", []], [null, "abonne", []], [null, "abonne", []],
  ["Pour la bande", "abonne", []], [null, "abonne", []], [null, "abonne", []],
], "de qui m'a bloqué, suspendue, signalée, d'un compte privé : sans titre");
egal([e.commentaires.map((c) => c.texte), e.jaimesCommentaires, e.cloche.map((c) => c.type)], [["Trop bon"], ["2"], ["mention"]]);
egal(e.signalements.map((s) => [s.cible, s.raison, s.precision, s.explication, s.statut]), [["message", "haine", "Insultes", "Il m'a insulté", "retenu"], ["liste", "arnaque", null, "", "a-traiter"]]);
egal(e.masques, [{ cible: "liste", cibleId: "3" }]);
egal(e.limitations, [
  {
    motif: "pub-cachee", motivation: "Des liens de pub dans tes commentaires", debut: il(20000), fin: il(5000), leveeLe: il(10000),
    contestation: null, contesteLe: null, reexamineLe: null, decideeLe: il(20100),
  },
  {
    motif: "haine", motivation: "Des insultes répétées dans une discussion", debut: il(1000), fin: null, leveeLe: null,
    contestation: "Je n'ai insulté personne", contesteLe: il(500), reexamineLe: il(100), decideeLe: il(1000),
  },
], "tes limitations, de la plus ancienne ; ni id, ni compte, ni personne de l'équipe");
const texte = JSON.stringify(e);
for (const interdit of ["Secret de Malo", "CODESECRET23", "Pas à moi", "v1:", "pseudo.3", "pseudo.nouveau", "idpublicck", "Réponse de 3", "Club caché", "Chez 3",
  "Sans organisateur", "De 3", "Suspendue", "Signalée", "Compte privé", "Note privée", "Pour l'auteur", "Je conteste", "instantane-secret",
  "Quittée par 1", "Colonne pas réalignée", "Motivation pour le compte 2"]) egal(texte.includes(interdit), false, interdit);
// Pour 2 : « organisateur » là où il a la main (sa sortie ; celle que 1 a quittée ; celle où la colonne garde 1, qui n'y est
// plus), et pas la sortie 60 où la colonne le nomme sans qu'il y ait d'invitation
const pour2 = await service.exporter(2, T);
egal(pour2.sorties.map((s) => [s.titre, s.role]), [["Chez 2", "organisateur"], ["Quittée par 1", "organisateur"], ["Colonne pas réalignée", "organisateur"]]);
egal(pour2.limitations?.map((l) => l.motivation), ["Motivation pour le compte 2"]);
const pour3 = await service.exporter(3, T);
egal([pour3.invitationsGroupes, pour3.bloques.map((p) => p.pseudo), pour3.conversations.map((c) => [c.id, c.membres, c.messages.map((m) => m.texte)])],
  [[{ titre: null, date: pour3.invitationsGroupes[0]!.date, statut: "refuse" }], ["pseudo.1"], [["4", ["pseudo.nouveau"], ["Réponse de 3"]], ["8", ["pseudo.nouveau"], []]]],
  "3 a refusé le groupe 2 : sans son titre ; il a bloqué 1 : 1 seulement dans « bloques »");
egal(JSON.stringify({ ...pour3, bloques: [] }).includes("pseudo.1"), false, "et nulle part ailleurs");
const pour4 = await service.exporter(4, T);
egal([pour4.profil, pour4.demandesBande.envoyees.map((d) => d.personne.pseudo)], [null, ["pseudo.1"]], "sans profil social : profil null ; sa demande refusée se lit toujours « envoyée »");
egal(Number((await q(`SELECT count(*) AS n FROM profils_sociaux WHERE compte_id = 4`))[0]!.n), 0, "rien n'est créé");
await terminerEssai(import.meta.url, essai, verifications.nombre);
