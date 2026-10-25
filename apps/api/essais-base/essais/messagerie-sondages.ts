import "../socle/garde-fou.ts";
import { randomBytes, randomUUID } from "node:crypto";
import { QUESTION_SONDAGE } from "../../../../packages/commun/src/regles/chat.ts";
import type { MessageApi } from "../../../../packages/commun/src/types/messagerie.ts";
import { dechiffrerLieuSondage } from "../../src/fonctions/social/dechiffrer-lieu-sondage.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import { creerStockageMediasChatEnMemoire } from "../../src/services/stockage-medias-chat.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const q = essai.sql;
const { creerRelationsSociales } = await import("../../src/services/relations-sociales.ts");
const { creerDepotMessagerie, creerTablesMessagerie } = await import("../../src/services/messagerie-tables.ts");
const { creerMessagerie } = await import("../../src/services/messagerie.ts");
const { lireDonneesExportSocial } = await import("../../src/services/export-social.ts");
const { rechiffrerSocial } = await import("../../src/services/rechiffrement-social.ts");
const verifications = creerVerifications();
const { egal, vrai } = verifications;

const T = new Date("2026-10-22T18:00:00Z");
const MINUTE = 60_000;
const apres = (minutes: number) => new Date(T.getTime() + minutes * MINUTE);
const compte = async (pseudo: string, prenom: string) => {
  const id = await insererLigne(essai.db, "comptes", { email: `${pseudo}@exemple.fr`, prenom, points: 0, palier: "curieux", pseudo });
  await insererLigne(essai.db, "profils_sociaux", { compte_id: id, id_public: `${pseudo}xxxxxxxxxx`.slice(0, 10) });
  return id;
};
const lieu = (nom: string, statut = "publie") => insererLigne(essai.db, "lieux", { nom, statut });

const lea = await compte("lea", "Léa");
const malo = await compte("malo", "Malo");
const zoe = await compte("zoe", "Zoé");
for (const [a, b] of [[lea, malo], [lea, zoe]] as const) {
  await insererLigne(essai.db, "membres_bandes", { compte_id: a, pote_id: b, cree_le: T });
  await insererLigne(essai.db, "membres_bandes", { compte_id: b, pote_id: a, cree_le: T });
}
const bella = await lieu("Pizzeria Bella");
const wok = await lieu("Le Wok d'Or");
const ferme = await lieu("Fermé", "brouillon");

const medias = creerStockageMediasChatEnMemoire();
const ancienne = randomBytes(32);
const chiffrement = creerChiffrementSocial(creerChiffrementDonnees(ancienne))!;
const relations = creerRelationsSociales(baseDeDonnees);
const depot = creerDepotMessagerie({ relations, medias, base: baseDeDonnees });
const messagerie = creerMessagerie({ depot, relations, chiffrement, medias });
const t = creerTablesMessagerie(baseDeDonnees, relations, medias);

const g = await messagerie.creerGroupe(lea, { titre: "Les gourmands", emoji: "🍕", invites: [malo, zoe] }, randomUUID(), T);
if (!g.ok) throw new Error(`groupe : ${g.erreur}`);
const groupe = Number(g.conversation.id);
for (const id of [malo, zoe]) egal((await messagerie.repondreInvitation(id, groupe, true, T)).ok, true);

const idClient = randomUUID();
egal(await messagerie.envoyer(lea, groupe, { idClient: randomUUID(), type: "vote", lieux: [bella, ferme], finLe: apres(30) }, T), { ok: false, erreur: "lieu-inconnu" });
const envoi = await messagerie.envoyer(lea, groupe, { idClient, type: "vote", lieux: [bella, wok], finLe: apres(30) }, T);
if (!envoi.ok) throw new Error(`sondage : ${envoi.erreur}`);
const messageId = Number(envoi.message.id);
egal([envoi.message.texte, envoi.message.vote?.options], [QUESTION_SONDAGE, [{ ordre: 1, lieuId: bella, votes: 0 }, { ordre: 2, lieuId: wok, votes: 0 }]]);
egal(envoi.effets.filter((e) => e.quoi === "push").length, 2, "les deux autres membres prévenus");
const options = await q(`SELECT ordre, lieu_chiffre FROM options_sondages WHERE message_id = $1 ORDER BY ordre`, [messageId]);
egal(options.map((o) => o.ordre), ["1", "2"]);
vrai(options.every((o, i) => String(o.lieu_chiffre).startsWith("v1:") && !String(o.lieu_chiffre).split(":").includes(String([bella, wok][i]))), "aucun id de lieu en clair dans la base");
egal(dechiffrerLieuSondage(chiffrement, String(options[1]!.lieu_chiffre), { conversationId: groupe, idClient, ordre: 2 }), wok);
const colonnes = await q(`SELECT column_name FROM information_schema.columns WHERE table_name = 'options_sondages' ORDER BY column_name`);
egal(colonnes.map((c) => c.column_name), ["id", "lieu_chiffre", "message_id", "ordre"], "pas de colonne d'id de lieu");
egal((await messagerie.envoyer(lea, groupe, { idClient, type: "vote", lieux: [bella, wok], finLe: apres(30) }, T)).ok, true, "rejoué");
egal(Number((await q(`SELECT count(*)::int AS n FROM sondages_messages`))[0]!.n), 1);
const { lireContenuSignale } = await import("../../src/services/instantanes-signalements.ts");
const signale = await baseDeDonnees.$transaction((tx) => lireContenuSignale(tx as never, { chiffrement, relations }, malo, "message", String(messageId), T));
egal([signale?.contenu.cible, signale?.contenu.cible === "message" ? signale.contenu.lieux : null], ["message", [bella, wok]], "un sondage signalé garde ses lieux dans l'instantané");

egal(await t.voterSondage(messageId, malo, 2, T), true, "INSERT … SELECT … ON CONFLICT : premier vote");
egal(await t.voterSondage(messageId, malo, 2, T), false, "le même : rien ne change");
egal(await t.voterSondage(messageId, malo, 1, apres(1)), true, "changé");
egal(await t.voterSondage(messageId, malo, 3, T), false, "une option qui n'existe pas : rien");
egal((await q(`SELECT o.ordre, v.vote_le FROM votes_sondages v JOIN options_sondages o ON o.id = v.option_id WHERE v.compte_id = $1`, [malo])).map((v) => v.ordre), ["1"]);
const vote = await messagerie.voterSondage(zoe, groupe, messageId, 2, T);
if (!vote.ok) throw new Error(`vote : ${vote.erreur}`);
egal([vote.message.vote?.monVote, vote.message.vote?.votants, vote.message.vote?.options.map((o) => o.votes)], [2, 2, [1, 1]]);
egal((await messagerie.voterSondage(lea, groupe, messageId, 2, T)).ok, true);
egal(await t.retirerVoteSondage(messageId, lea), true);
egal(await t.retirerVoteSondage(messageId, lea), false);
egal((await messagerie.voterSondage(lea, groupe, messageId, 2, T)).ok, true);
const lus = (await t.lireSondages([messageId, 999])).get(messageId)!;
egal([lus.finLe.getTime(), lus.closLe, lus.options.map((o) => o.ordre), lus.votes], [apres(30).getTime(), null, [1, 2], [
  { compteId: lea, ordre: 2 }, { compteId: malo, ordre: 1 }, { compteId: zoe, ordre: 2 },
]]);
egal((await t.lireNomsLieux([bella, wok, 99999])), new Map([[bella, "Pizzeria Bella"], [wok, "Le Wok d'Or"]]));

const avant = await baseDeDonnees.membreConversation.findFirst({ where: { conversationId: groupe, compteId: malo } });
egal(avant!.luLe, null);
await depot.ecrire((tx) => tx.avancerMembre(groupe, malo, { luJusqua: messageId, luLe: apres(2) }));
await depot.ecrire((tx) => tx.avancerMembre(groupe, malo, { luJusqua: messageId - 1, luLe: apres(5) }));
const lu = (await t.lireMembres([groupe])).find((m) => m.compteId === malo)!;
egal([lu.luJusqua, lu.luLe?.getTime()], [messageId, apres(2).getTime()], "lu_le seulement quand luJusqua avance");
egal(await messagerie.marquerLu(zoe, groupe, messageId, apres(3)), true);
egal((await t.lireMembres([groupe])).find((m) => m.compteId === zoe)!.luLe?.getTime(), apres(3).getTime());

const exportLea = await lireDonneesExportSocial(baseDeDonnees, lea);
egal(exportLea.sondages.map((s) => [s.messageId, s.options.length, s.closLe]), [[messageId, 2, null]]);
egal(exportLea.votesSondages.map((v) => [v.messageId, v.conversationId, v.idClient, v.ordre]), [[messageId, groupe, idClient, 2]]);
egal((await lireDonneesExportSocial(baseDeDonnees, malo)).sondages, [], "seulement les siens");

egal(await t.listerSondagesEchus(apres(29), 10), []);
egal(await t.listerSondagesEchus(apres(30), 10), [{ messageId, conversationId: groupe }]);
const [p1, p2] = await Promise.all([messagerie.passerTaches(apres(31)), messagerie.passerTaches(apres(31))]);
egal(p1.sondages + p2.sondages, 1, "un seul passage le clôt");
egal(await t.cloreSondage(messageId, 1, apres(32)), false, "déjà clos");
const clos = await q(`SELECT clos_le, gagnant FROM sondages_messages WHERE message_id = $1`, [messageId]);
egal([new Date(String(clos[0]!.clos_le)).getTime(), clos[0]!.gagnant], [apres(31).getTime(), "2"]);
const fil = await messagerie.lireFil(malo, groupe, { version: null, avant: null }, apres(31));
const dernier = fil && "messages" in fil ? (fil.messages.at(-1) as MessageApi) : null;
egal([dernier?.systeme, dernier?.texte], ["sondage-clos", "Le vote est fini : Le Wok d'Or gagne avec 2 voix sur 3."]);
egal((await messagerie.voterSondage(malo, groupe, messageId, 2, apres(31))).ok, false);

const v2 = creerChiffrementDonnees(randomBytes(32), { version: 2, anciennes: [{ version: 1, cle: ancienne }] });
const bilan = await rechiffrerSocial(v2, medias, baseDeDonnees);
vrai(bilan !== null && bilan.illisibles === 0 && bilan.restants === 0, "tout rechiffré, options des sondages comprises");
const rechiffrees = await q(`SELECT ordre, lieu_chiffre FROM options_sondages WHERE message_id = $1 ORDER BY ordre`, [messageId]);
vrai(rechiffrees.every((o) => String(o.lieu_chiffre).startsWith("v2:")));
egal(dechiffrerLieuSondage(creerChiffrementSocial(v2)!, String(rechiffrees[0]!.lieu_chiffre), { conversationId: groupe, idClient, ordre: 1 }), bella);

const autre = await messagerie.envoyer(lea, groupe, { idClient: randomUUID(), type: "vote", lieux: [bella, wok], finLe: apres(60) }, T);
if (!autre.ok) throw new Error("second sondage");
await messagerie.voterSondage(malo, groupe, Number(autre.message.id), 1, T);
egal((await messagerie.supprimerMessage(lea, groupe, Number(autre.message.id), T)).ok, true);
egal((await q(`SELECT
  (SELECT count(*) FROM sondages_messages WHERE message_id = $1)::int AS s,
  (SELECT count(*) FROM options_sondages WHERE message_id = $1)::int AS o,
  (SELECT count(*) FROM votes_sondages WHERE message_id = $1)::int AS v`, [Number(autre.message.id)]))[0], { s: "0", o: "0", v: "0" }, "supprimé pour tous : le sondage part");
await q(`DELETE FROM comptes WHERE id = $1`, [zoe]);
egal(Number((await q(`SELECT count(*)::int AS n FROM votes_sondages WHERE compte_id = $1`, [zoe]))[0]!.n), 0, "compte supprimé : ses votes partent");

const conversationSortie = await insererLigne(essai.db, "conversations", { type: "sortie", version: 0 });
for (const id of [lea, malo]) await insererLigne(essai.db, "membres_conversations", { conversation_id: conversationSortie, compte_id: id });
const sortie = await insererLigne(essai.db, "sorties", {
  conversation_id: conversationSortie, organisateur_id: lea, titre: "Pizza du jeudi", emoji: "🍕", quand: apres(3 * 60), fin_vote: apres(60), vote_termine_le: apres(60),
  cree_le: T,
});
await insererLigne(essai.db, "invitations_sorties", { sortie_id: sortie, compte_id: lea, statut: "accepte" });
await insererLigne(essai.db, "invitations_sorties", { sortie_id: sortie, compte_id: malo, statut: "accepte" });
egal(await t.lireParticipantsSortie(sortie), [lea, malo].sort((a, b) => a - b));
egal(await t.listerSortiesARappeler(apres(119), apres(179), 10), [], "61 min avant : pas encore");
egal(await t.listerSortiesARappeler(apres(120), apres(180), 10), [sortie]);
const pris = await depot.ecrire((tx) => tx.prendreRappelSortie(sortie, apres(120), apres(180), apres(120)));
egal([pris?.id, pris?.conversationId, pris?.titre, pris?.quand.getTime(), pris?.creeLe.getTime()], [sortie, conversationSortie, "Pizza du jeudi", apres(180).getTime(), T.getTime()]);
egal(await depot.ecrire((tx) => tx.prendreRappelSortie(sortie, apres(120), apres(180), apres(121))), null, "UPDATE … RETURNING : une seule fois");
await q(`UPDATE sorties SET rappel_envoye_le = NULL WHERE id = $1`, [sortie]);
const rappel = await messagerie.passerTaches(apres(121));
egal([rappel.rappels, rappel.effets.filter((e) => e.quoi === "push").length], [1, 2]);
const systeme = await q(`SELECT systeme, auteur_id FROM messages_conversations WHERE conversation_id = $1`, [conversationSortie]);
egal(systeme, [{ systeme: "rappel-sortie", auteur_id: null }]);
egal((await messagerie.passerTaches(apres(122))).rappels, 0);

await terminerEssai(import.meta.url, essai, verifications.nombre);
