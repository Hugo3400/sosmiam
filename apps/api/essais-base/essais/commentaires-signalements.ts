// Essai sur base (PGlite, toutes les migrations du dépôt) des services Prisma du lot L6 : commentaires, signalements
// sociaux (6 cibles, instantané, masquage pour tous), décisions et contestation, nombre de commentaires du fil. Le VRAI client
// Prisma passe par l'adaptateur pg, branché sur PGlite (socle/) ; le client global (connexion.ts, dont se sert
// creerPublicationsApp) aussi. Aucune vraie base.
import "../socle/garde-fou.ts";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import { creerCommentaires } from "../../src/services/commentaires.ts";
import { creerDecisionsModerationApp } from "../../src/services/decisions-moderation-app.ts";
import { creerPublicationsApp } from "../../src/services/publications-app.ts";
import { creerRelationsSociales } from "../../src/services/relations-sociales.ts";
import { creerSignalementsSociaux } from "../../src/services/signalements-sociaux.ts";
import { creerSocial } from "../../src/services/social.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { base } = essai;
const verifications = creerVerifications();
const { egal } = verifications;
const q = essai.sql;

const T = new Date("2026-10-14T10:00:00Z");
const JOUR = 86_400_000;
// Comptes : 1 moi (fiable : e-mail vérifié, 30 jours), 2 léa, 3 gérant, 4 bloqueur, 5 jeune (2 jours)
for (const [id, pseudo, ancien] of [[1, "moi.essai", true], [2, "lea.essai", true], [3, "gerant.essai", true], [4, "bloqueur.essai", true], [5, "jeune.essai", false]] as const) {
  await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo, cree_le, email_verifie_le) VALUES ($1, $2, 'x', $3, '2026-10-08', $4, $5, $6)`,
    [id, `c${id}@exemple.fr`, `Prénom${id}`, pseudo, new Date(T.getTime() - (ancien ? 30 : 2) * JOUR).toISOString(), ancien ? T.toISOString() : null]);
  await q(`INSERT INTO profils_sociaux (compte_id, id_public) VALUES ($1, $2)`, [id, `idpublic${"abcde"[id - 1]}${"k"}`.slice(0, 10)]);
}
const idPublic = (id: number) => `idpublic${"abcde"[id - 1]}k`.slice(0, 10);
await q(`INSERT INTO membres_bandes (compte_id, pote_id) VALUES (1, 2), (2, 1)`);
await q(`INSERT INTO blocages (bloqueur_id, bloque_id) VALUES (4, 1)`);
await base.lieu.create({ data: {
  id: 7, nom: "Chez Léa", type: "resto", emoji: "🍝", info: "i", texte: "t", quartier: "q", ville: "Nantes", prix: "€", couleurs: [], horaires: "h", plat: "p", tags: [], envies: [], statut: "publie",
} as never });
await base.publication.create({ data: { id: 1, lieuId: 7, auteurType: "createur", auteurPseudo: "lea.mange", legende: "Pâtes", statut: "publiee", publieeLe: new Date(T.getTime() - JOUR) } as never });
await base.publication.create({ data: { id: 2, lieuId: 7, auteurType: "createur", auteurPseudo: "lea.mange", legende: "Brouillon", statut: "brouillon" } as never });

const chiffrement = creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32)))!;
const relations = creerRelationsSociales(base);
const social = creerSocial({ relations, tirer: (m: number) => Math.floor(Math.random() * m), base });
const lireRole = async (compteId: number, lieuId: number) => (compteId === 3 && lieuId === 7 ? "gerant" : null);
const commentaires = creerCommentaires({ relations, social, lireRole, chiffrement }, base);
const signalements = creerSignalementsSociaux({ relations, chiffrement }, base);
const contestations: number[] = [];
const decisions = creerDecisionsModerationApp({
  contesterSignalement: async (id: number, texte: string, maintenant: Date) => {
    const { count } = await base.signalement.updateMany({ where: { id, statut: { in: ["retenu", "rejete"] } }, data: { contestation: texte, contesteLe: maintenant, reexamineLe: null } });
    if (count > 0) contestations.push(id);
    return count > 0;
  },
}, base);

// --- Commentaires
egal(await commentaires.listerPublics(2, null, T), null, "brouillon : publication-inconnue");
const c1 = await commentaires.commenter(2, 1, { texte: "Merci @moi.essai et @bloqueur.essai", reponseA: null, commeLieu: false }, T);
assert.ok(c1.ok);
egal(c1.commentaire.mentions, [{ pseudo: "moi.essai", id: idPublic(1) }, { pseudo: "bloqueur.essai", id: idPublic(4) }]);
egal(c1.effets.map((e: { notification: { compteId: number; type: string } }) => [e.notification.compteId, e.notification.type]), [[1, "mention"]], "seulement la pote");
const r1 = await commentaires.commenter(1, 1, { texte: "Réponse", reponseA: Number(c1.commentaire.id), commeLieu: false }, new Date(T.getTime() + 1000));
assert.ok(r1.ok);
const r2 = await commentaires.commenter(3, 1, { texte: "Le lieu répond", reponseA: Number(r1.commentaire.id), commeLieu: true }, new Date(T.getTime() + 2000));
assert.ok(r2.ok);
egal([r2.commentaire.auteur, r2.commentaire.reponseA], [{ type: "lieu" }, c1.commentaire.id], "un seul niveau, signé le lieu");
egal((await commentaires.commenter(1, 1, { texte: "x", reponseA: null, commeLieu: true }, T)), { ok: false, erreur: "reserve-au-gerant" });
const page = await commentaires.listerPublics(1, null, T);
egal([page!.total, page!.commentaires.map((c: { texte: string }) => c.texte)], [3, ["Le lieu répond", "Réponse", "Merci @moi.essai et @bloqueur.essai"]]);
egal(await commentaires.basculerJaime(1, Number(c1.commentaire.id), true, T), { ok: true, jaimes: 1 });
egal(await commentaires.basculerJaime(1, Number(c1.commentaire.id), true, T), { ok: true, jaimes: 1 }, "sans doublon");
egal(await commentaires.basculerJaime(4, Number(r1.commentaire.id), true, T), { ok: false, erreur: "commentaire-inconnu" }, "il m'a bloqué");
const modifie = await commentaires.modifier(2, Number(c1.commentaire.id), "Merci @moi.essai et @gerant.essai", new Date(T.getTime() + 3000));
assert.ok(modifie.ok);
egal(modifie.commentaire.modifieLe, new Date(T.getTime() + 3000).toISOString().replace(/\.\d{3}Z$/, ".000Z"));
// Masquage par le lieu : signalement « lieu », instantané, puis deja-examine après un rejet
const masque = await commentaires.masquerParLieu(3, Number(r1.commentaire.id), true, T);
assert.ok(masque.ok);
egal(masque.effets[0].notification.detail, "masque-par-le-lieu");
const [lieu] = await base.signalement.findMany({ where: { cible: "commentaire", cibleId: r1.commentaire.id, source: "lieu" } });
egal([lieu.raison, lieu.signaleParId, lieu.auteurContenuId, lieu.lieuId], ["autre", 3, 1, 7]);
egal(JSON.parse(chiffrement.dechiffrerInstantane(lieu.instantaneChiffre!, lieu.id)).texte, "Réponse");
egal((await commentaires.listerPublics(1, null, T))!.total, 2, "masqué : plus compté");
const miens = await commentaires.lireMiens(1, 1, T);
egal([miens!.jaimes, miens!.miens.map((c: { etat: string }) => c.etat), miens!.peutRepondreCommeLieu], [[c1.commentaire.id], ["masque-par-le-lieu"], false]);
egal((await commentaires.masquerParLieu(3, Number(r1.commentaire.id), true, T)).ok, true, "deux fois : rien de plus");
egal(await base.signalement.count({ where: { source: "lieu" } }), 1);
await commentaires.masquerParLieu(3, Number(r1.commentaire.id), false, T);
await base.signalement.update({ where: { id: lieu.id }, data: { statut: "rejete", traiteLe: T } });
egal(await commentaires.masquerParLieu(3, Number(r1.commentaire.id), true, T), { ok: false, erreur: "deja-examine" });
// Supprimer : avec une réponse → « Commentaire supprimé » ; sans → effacé
egal(await commentaires.supprimer(1, Number(c1.commentaire.id), T), { ok: false, erreur: "reserve-a-l-auteur" });
egal(await commentaires.supprimer(2, Number(c1.commentaire.id), T), { ok: true });
const apres = await commentaires.listerPublics(1, null, T);
const supprime = apres!.commentaires.find((c: { id: string }) => c.id === c1.commentaire.id);
egal([supprime?.supprime, supprime?.texte, apres!.total], [true, "", 2]);
egal(await commentaires.supprimer(3, Number(r2.commentaire.id), T), { ok: true }, "le gérant supprime la réponse du lieu");
egal(await base.commentairePublication.count({ where: { id: Number(r2.commentaire.id) } }), 0, "effacée pour de bon");
// Le nombre du fil : le VRAI service du fil (creerPublicationsApp().lister, client global branché sur PGlite)
const fil = await creerPublicationsApp((f: string) => `https://api.exemple.fr/app/medias/${f}`).lister(null, 20, T);
egal(fil.publications.map((p: { id: string; commentaires: number }) => [p.id, p.commentaires]), [["1", 1]], "seule la réponse de moi, démasquée, reste visible");

// --- Correctifs de la relecture : répondre à une réponse, publication cachée
const duBloqueur = await commentaires.commenter(4, 1, { texte: "Le fil du bloqueur", reponseA: null, commeLieu: false }, T);
assert.ok(duBloqueur.ok);
const deLea = await commentaires.commenter(2, 1, { texte: "Léa répond", reponseA: Number(duBloqueur.commentaire.id), commeLieu: false }, T);
assert.ok(deLea.ok);
egal(await commentaires.commenter(1, 1, { texte: "Par la réponse", reponseA: Number(deLea.commentaire.id), commeLieu: false }, T), { ok: false, erreur: "commentaire-inconnu" }, "4 a bloqué 1");
await base.commentairePublication.update({ where: { id: Number(duBloqueur.commentaire.id) }, data: { suspenduLe: T } });
egal(await commentaires.commenter(5, 1, { texte: "Sous un suspendu", reponseA: Number(deLea.commentaire.id), commeLieu: false }, T), { ok: false, erreur: "commentaire-inconnu" }, "haut suspendu");
await base.commentairePublication.update({ where: { id: Number(duBloqueur.commentaire.id) }, data: { suspenduLe: null, supprimeLe: T, texte: "" } });
const sousSupprime = await commentaires.commenter(5, 1, { texte: "Sous un supprimé", reponseA: Number(deLea.commentaire.id), commeLieu: false }, T);
egal([sousSupprime.ok, sousSupprime.ok && sousSupprime.commentaire.reponseA], [true, duBloqueur.commentaire.id], "« Commentaire supprimé » : le fil continue");
await base.publication.create({ data: { id: 3, lieuId: 7, auteurType: "createur", auteurPseudo: "lea.mange", legende: "Cachée", statut: "publiee", publieeLe: new Date(T.getTime() - JOUR) } as never });
const sousCachee = await commentaires.commenter(2, 3, { texte: "Avant", reponseA: null, commeLieu: false }, T);
assert.ok(sousCachee.ok);
await base.publication.update({ where: { id: 3 }, data: { statut: "masquee" } });
egal(await commentaires.modifier(2, Number(sousCachee.commentaire.id), "Après", T), { ok: false, erreur: "commentaire-inconnu" }, "modifier sous une publication cachée");
egal(await commentaires.supprimer(1, Number(sousCachee.commentaire.id), T), { ok: false, erreur: "commentaire-inconnu" }, "pas 403 sous une publication cachée");
egal(await commentaires.supprimer(2, Number(sousCachee.commentaire.id), T), { ok: true }, "le sien se supprime toujours");

// --- Signalements des 6 cibles
await q(`INSERT INTO conversations (id, type, cree_par_id, titre_chiffre, emoji, version) VALUES (10, 'prive', 2, NULL, NULL, 4), (11, 'groupe', 2, $1, '🍕', 0), (12, 'sortie', 2, NULL, NULL, 0)`, [chiffrement.chiffrerTitre("Les gourmands", 11)]);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id) VALUES (10, 1), (10, 2), (11, 1), (11, 2), (12, 2)`);
const idClient = randomUUID();
await q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, texte_chiffre) VALUES (20, 10, 2, 'texte', $1, $2)`, [idClient, chiffrement.chiffrerMessage("Message signalé", 10, idClient)]);
const idLieu = randomUUID();
await q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, texte_chiffre) VALUES (21, 10, 2, 'lieu', $1, $2)`, [idLieu, chiffrement.chiffrerMessage(JSON.stringify({ l: 7, m: "À tester !" }), 10, idLieu)]);
await q(`INSERT INTO listes_lieux (id, auteur_id, titre, emoji, visibilite) VALUES (30, 2, 'Pizzas', '🍕', 'bande'), (31, 4, 'Bloqué', '🍕', 'tous')`);
await q(`INSERT INTO lieux_listes (liste_id, lieu_id) VALUES (30, 7)`);
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote) VALUES (40, 12, 2, 'Pizza du jeudi', '🍕', $1, $1)`, [new Date(T.getTime() + 3 * JOUR).toISOString()]);
await q(`INSERT INTO invitations_sorties (sortie_id, compte_id, statut) VALUES (40, 2, 'accepte'), (40, 1, 'invite')`);
await q(`INSERT INTO propositions_sorties (sortie_id, lieu_id) VALUES (40, 7)`);
const valide = (cible: string, cibleId: string, raison = "haine") => ({ cible, cibleId, raison, precision: null, explication: "" }) as never;
for (const [cible, cibleId] of [["message", "20"], ["message", "21"], ["liste", "30"], ["profil", idPublic(2)], ["sortie", "40"], ["groupe", "11"]] as const) {
  const r = await signalements.signaler(1, valide(cible, cibleId), T);
  egal([cible, cibleId, r.ok && r.deja, r.ok && r.masquePourTous], [cible, cibleId, false, false]);
  egal((await signalements.signaler(1, valide(cible, cibleId), T)), { ok: true, deja: true, masquePourTous: false, effets: [] });
}
const lire = async (cible: string, cibleId: string) => {
  const s = await base.signalement.findFirstOrThrow({ where: { cible, cibleId, source: "app" } });
  return { s, i: JSON.parse(chiffrement.dechiffrerInstantane(s.instantaneChiffre!, s.id)) };
};
egal((await lire("message", "20")).i.texte, "Message signalé");
egal([(await lire("message", "21")).i.lieuId, (await lire("message", "21")).i.texte], [7, "À tester !"]);
egal((await lire("groupe", "11")).i.titre, "Les gourmands");
egal([(await lire("liste", "30")).i.lieux, (await lire("liste", "30")).s.auteurContenuId], [[7], 2]);
egal((await lire("sortie", "40")).i.lieux, [7]);
egal((await lire("profil", idPublic(2))).i.pseudo, "lea.essai");
egal(await signalements.signaler(1, valide("liste", "31"), T), { ok: false, erreur: "contenu-inconnu" }, "liste de quelqu'un qui m'a bloqué");
egal(await signalements.signaler(5, valide("message", "20"), T), { ok: false, erreur: "contenu-inconnu" }, "pas membre");
egal(await signalements.signaler(2, valide("message", "20"), T), { ok: false, erreur: "contenu-inconnu" }, "son propre message");
egal(await signalements.listerMiens(1, "message"), ["21", "20"]);
egal([...(await signalements.lireSignalesPar(1, "message", ["20", "99"]))], ["20"]);
// « choquant » : le jeune compte ne masque pas ; moi (fiable) masque, la discussion bouge
const cm = await commentaires.commenter(2, 1, { texte: "Choquant", reponseA: null, commeLieu: false }, T);
assert.ok(cm.ok);
const jeune = await signalements.signaler(5, valide("commentaire", cm.commentaire.id, "choquant"), T);
egal(jeune.ok && jeune.masquePourTous, false);
const idClient2 = randomUUID();
await q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, texte_chiffre) VALUES (22, 10, 2, 'texte', $1, $2)`, [idClient2, chiffrement.chiffrerMessage("Horrible", 10, idClient2)]);
const choc = await signalements.signaler(1, valide("message", "22", "choquant"), T);
egal([choc.ok && choc.masquePourTous, choc.ok && choc.effets[0].notification.type], [true, "contenu-masque"]);
egal(Number((await q(`SELECT version FROM conversations WHERE id = 10`))[0].version), 5, "la discussion bouge");
egal((await q(`SELECT suspendu_le IS NOT NULL AS masque FROM messages_conversations WHERE id = 22`))[0].masque, "t", "masqué pour tous");

// --- Décisions et contestation
egal((await decisions.listerDecisions(2, T)).map((d: { statut: string; role: string; cible: string }) => [d.cible, d.statut, d.role]), [["message", "masque", "auteur"]]);
await q(`UPDATE signalements SET statut = 'retenu', traite_le = $1, motif = 'haine', motivation = 'Pourquoi' WHERE cible = 'message' AND cible_id = '22'`, [T.toISOString()]);
await q(`UPDATE signalements SET statut = 'rejete', traite_le = $1 WHERE cible = 'groupe'`, [T.toISOString()]);
const pourLea = await decisions.listerDecisions(2, T);
egal(pourLea.find((d: { cible: string }) => d.cible === "message")?.statut, "retenu");
const sMessage = (await lire("message", "22")).s;
egal(await decisions.contester(2, sMessage.id, "Je conteste vraiment.", T), { ok: true });
egal(await decisions.contester(2, sMessage.id, "Encore.", T), { ok: false, erreur: "deja-contestee" });
const sGroupe = (await lire("groupe", "11")).s;
egal(await decisions.contester(1, sGroupe.id, "Relisez bien.", new Date(T.getTime() + 200 * JOUR)), { ok: false, erreur: "contestation-hors-delai" });
egal(await decisions.contester(1, sGroupe.id, "Relisez bien.", T), { ok: true });
egal(await decisions.contester(5, sGroupe.id, "Pas à moi.", T), { ok: false, erreur: "decision-inconnue" });
egal(contestations, [sMessage.id, sGroupe.id]);
const pourMoi = (await decisions.listerDecisions(1, T)).map((d: { cible: string; role: string; statut: string; contestation: string }) => [d.cible, d.role, d.statut, d.contestation]);
// Moi : auteur de la réponse masquée par le lieu puis remise en ligne (rejet), et deux signalements jugés
egal(pourMoi.sort(), [["commentaire", "auteur", "rejete", "aucune"], ["groupe", "signale", "rejete", "envoyee"], ["message", "signale", "retenu", "envoyee"]]);

// --- Correctifs de la relecture : groupe signalé par un invité, rejet qui vaut même après une modification
await q(`INSERT INTO invitations_groupes (conversation_id, compte_id, invite_par_id, statut) VALUES (11, 5, 2, 'invite'), (11, 3, 2, 'refuse')`);
const parInvite = await signalements.signaler(5, valide("groupe", "11"), T);
egal([parInvite.ok, parInvite.ok && parInvite.deja], [true, false], "invité en attente : il signale le groupe");
egal(await signalements.signaler(3, valide("groupe", "11"), T), { ok: false, erreur: "contenu-inconnu" }, "invitation refusée");
const surListe = await signalements.signaler(2, valide("liste", "31", "arnaque"), T);
assert.ok(surListe.ok);
await q(`UPDATE signalements SET statut = 'rejete', traite_le = $1 WHERE cible = 'liste' AND cible_id = '31'`, [T.toISOString()]);
await q(`INSERT INTO lieux_listes (liste_id, lieu_id) VALUES (31, 7)`);
await q(`UPDATE listes_lieux SET modifie_le = $1 WHERE id = 31`, [new Date(T.getTime() + JOUR).toISOString()]);
const apresRejet = await signalements.signaler(3, valide("liste", "31", "choquant"), new Date(T.getTime() + 2 * JOUR));
egal([apresRejet.ok, apresRejet.ok && apresRejet.masquePourTous], [true, false], "un rejet passé vaut même après un lieu ajouté");
egal((await q(`SELECT suspendue_le IS NULL AS visible FROM listes_lieux WHERE id = 31`))[0].visible, "t");
await terminerEssai(import.meta.url, essai, verifications.nombre);
