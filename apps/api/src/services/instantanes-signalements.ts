// Ce qu'un signalement de contenu social lit et écrit dans la base (spécification sociale A.7, B.10), dans la transaction
// du signalement : le contenu tel qu'il est maintenant, s'il est VISIBLE pour celui qui signale (même règle que les lectures
// de chaque domaine : un 404 ne dit rien de plus qu'une lecture), puis le signalement et son INSTANTANÉ chiffré (sous-clé de
// la modération, contexte « signalement:<id> »), et le masquage pour tous d'un contenu « choquant ». Servi aussi au
// masquage d'un commentaire par le gérant du lieu (commentaires.ts). Un message se signale sous le verrou de sa conversation
// (verrouillerConversationDuMessage, contre la course avec le ménage de nuit). Jamais un texte de message ni un pseudo au
// journal.
import { peutVoirListe } from "../../../../packages/commun/src/fonctions/social/peut-voir-liste.ts";
import { calculerNiveauProfil } from "../../../../packages/commun/src/regles/calculer-niveau-profil.ts";
import type { CibleSignalementSocial, SignalementSocialValide } from "../../../../packages/commun/src/types/signalement.ts";
import type { VisibiliteListe } from "../../../../packages/commun/src/types/listes.ts";
import { construireInstantane, type AuteurInstantane, type ContenuSignale } from "../fonctions/social/construire-instantane.ts";
import { lireMentionsCommentaire } from "../fonctions/social/lire-mentions-commentaire.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import { filtrePublicationVisible } from "./publications-app.ts";
import type { RelationsSociales, TransactionSociale } from "./relations-sociales-regles.ts";
import type { ContenuLu, NouveauSignalementSocial } from "./signalements-sociaux-regles.ts";

export type DependancesInstantanes = { chiffrement: ChiffrementSocial; relations: Pick<RelationsSociales, "bloqueEntre" | "lireLiens" | "trouverCompte"> };

/** pourLeLieu : le gérant relit un commentaire qu'il a masqué (pour le démasquer, ou le masquer de nouveau) */
export type OptionsLecture = { pourLeLieu?: boolean };

async function lireAuteur(tx: TransactionSociale, compteId: number | null): Promise<AuteurInstantane> {
  if (compteId === null) return null;
  const compte = await tx.compte.findUnique({ where: { id: compteId }, select: { pseudo: true, prenom: true } });
  return compte ? { pseudo: compte.pseudo, prenom: compte.prenom } : null;
}

/** Un texte chiffré relu pour l'instantané ; null s'il est illisible (rien n'est dit de plus) */
function relire(dechiffrer: () => string): string | null {
  try {
    return dechiffrer();
  } catch {
    return null;
  }
}

/** Le texte clair d'un lieu envoyé : { l: lieuId, m: petit mot ou null } (messagerie.prisma) ; null s'il est mal formé */
function lireLieuEnvoye(clair: string): { l?: unknown; m?: unknown } | null {
  try {
    const lu: unknown = JSON.parse(clair);
    return typeof lu === "object" && lu !== null ? (lu as { l?: unknown; m?: unknown }) : null;
  } catch {
    return null;
  }
}

async function lireCommentaire(tx: TransactionSociale, id: number, maintenant: Date, o: OptionsLecture): Promise<ContenuLu | null> {
  const c = await tx.commentairePublication.findFirst({
    where: { id, supprimeLe: null, retireLe: null, suspenduLe: null, ...(o.pourLeLieu ? {} : { masqueParLieuLe: null }), publication: filtrePublicationVisible(maintenant) },
    select: {
      id: true, auteurId: true, commeLieuId: true, ecritParId: true, texte: true, mentions: true, masqueParLieuLe: true, creeLe: true,
      publication: { select: { id: true, lieuId: true } },
    },
  });
  if (!c) return null;
  return {
    contenu: {
      cible: "commentaire", texte: c.texte, mentions: lireMentionsCommentaire(c.mentions), publicationId: c.publication.id, lieuId: c.publication.lieuId,
      commeLieu: c.commeLieuId !== null, masqueParLieu: c.masqueParLieuLe !== null, auteur: await lireAuteur(tx, c.auteurId), date: c.creeLe,
    },
    auteurContenuId: c.auteurId ?? c.ecritParId,
    lieuId: c.publication.lieuId,
    fichierMedia: null,
  };
}

/**
 * Le signalement d'un message verrouille sa conversation (SELECT … FOR UPDATE) AVANT de lire le message, après le verrou du
 * compte qui signale : même ordre que la messagerie (le compte, puis la conversation). Le ménage de nuit verrouille la
 * conversation, puis relit « aucun message au signalement ouvert » : les deux ne se croisent plus. Ou bien le signalement
 * est validé d'abord, et le ménage le voit et garde la conversation ; ou bien le ménage passe d'abord, et le signalement
 * trouve ensuite le message parti (contenu-inconnu). Rien à faire pour un message inconnu (la lecture rendra null).
 */
export async function verrouillerConversationDuMessage(tx: TransactionSociale, cibleId: string): Promise<void> {
  const id = Number(cibleId);
  if (!Number.isSafeInteger(id) || id < 1) return;
  const message = await tx.messageConversation.findUnique({ where: { id }, select: { conversationId: true } });
  if (message) await tx.$queryRaw`SELECT id FROM conversations WHERE id = ${message.conversationId} FOR UPDATE`;
}

/** La règle d'accès des messages (B.0) : membre, après ton arrivée, auteur sans blocage ; ni supprimé, ni masqué, ni retiré */
async function lireMessage(tx: TransactionSociale, d: DependancesInstantanes, compteId: number, id: number, maintenant: Date): Promise<ContenuLu | null> {
  const m = await tx.messageConversation.findUnique({
    where: { id },
    select: {
      id: true, conversationId: true, auteurId: true, type: true, idClient: true, texteChiffre: true, fichier: true, typeMime: true, taille: true,
      dureeSecondes: true, mediaExpireLe: true, creeLe: true, supprimeLe: true, suspenduLe: true, retireLe: true,
      conversation: { select: { type: true, titreChiffre: true, emoji: true } },
    },
  });
  if (!m || m.supprimeLe || m.suspenduLe || m.retireLe) return null;
  const membre = await tx.membreConversation.findUnique({ where: { conversationId_compteId: { conversationId: m.conversationId, compteId } }, select: { visibleApres: true } });
  if (!membre || m.id <= membre.visibleApres) return null;
  if (m.auteurId !== null && m.auteurId !== compteId && (await d.relations.bloqueEntre(compteId, m.auteurId, tx))) return null;

  let texte: string | null = null;
  let lieuId: number | null = null;
  let illisible = false;
  if (m.texteChiffre) {
    const clair = relire(() => d.chiffrement.dechiffrerMessage(m.texteChiffre!, m.conversationId, m.idClient));
    if (clair === null) illisible = true;
    else if (m.type === "lieu") {
      const lu = lireLieuEnvoye(clair);
      lieuId = typeof lu?.l === "number" ? lu.l : null;
      texte = typeof lu?.m === "string" ? lu.m : null;
      illisible = lu === null;
    } else texte = clair;
  }
  const titre = m.conversation.type === "groupe" && m.conversation.titreChiffre ? relire(() => d.chiffrement.dechiffrerTitre(m.conversation.titreChiffre!, m.conversationId)) : null;
  const avecMedia = m.fichier !== null && (m.type === "photo" || m.type === "vocal");
  return {
    contenu: {
      cible: "message", type: m.type, texte, lieuId, illisible,
      media: avecMedia ? { typeMime: m.typeMime, taille: m.taille, dureeSecondes: m.dureeSecondes } : null,
      conversation: { type: m.conversation.type, titre, emoji: m.conversation.emoji }, auteur: await lireAuteur(tx, m.auteurId), date: m.creeLe,
    },
    auteurContenuId: m.auteurId,
    lieuId: null,
    // Gardé sur le disque tant que le signalement est ouvert, ou jugé (ou réexaminé) depuis moins de 183 jours, même si le
    // message part (signalementsGardantLeurFichier) ; seulement s'il n'a pas expiré
    fichierMedia: avecMedia && m.mediaExpireLe && m.mediaExpireLe > maintenant ? m.fichier : null,
  };
}

async function lireListe(tx: TransactionSociale, d: DependancesInstantanes, compteId: number, id: number): Promise<ContenuLu | null> {
  const l = await tx.listeLieux.findUnique({
    where: { id },
    select: {
      auteurId: true, titre: true, emoji: true, description: true, visibilite: true, suspendueLe: true, retireeLe: true,
      auteur: { select: { prive: true } },
      lieux: { select: { lieuId: true }, orderBy: [{ creeLe: "desc" }, { lieuId: "desc" }] },
      coAuteurs: { where: { compteId, statut: "accepte" }, select: { compteId: true } },
    },
  });
  if (!l || l.suspendueLe || l.retireeLe) return null;
  if (l.auteurId !== compteId) {
    const lien = (await d.relations.lireLiens(compteId, [l.auteurId])).get(l.auteurId);
    if (!lien || lien.bloqueParMoi || lien.mABloque) return null;
    const niveau = calculerNiveauProfil({ prive: l.auteur.prive }, { estMoi: false, pote: lien.pote, abonne: lien.jeSuis === "suivi" });
    if (!peutVoirListe({ visibilite: l.visibilite as VisibiliteListe }, niveau, l.coAuteurs.length > 0)) return null;
  }
  return {
    contenu: {
      cible: "liste", titre: l.titre, emoji: l.emoji, description: l.description, visibilite: l.visibilite, lieux: l.lieux.map((x) => x.lieuId),
      auteur: await lireAuteur(tx, l.auteurId),
    },
    auteurContenuId: l.auteurId, lieuId: null, fichierMedia: null,
  };
}

async function lireProfil(tx: TransactionSociale, d: DependancesInstantanes, compteId: number, idPublic: string): Promise<ContenuLu | null> {
  // Elle t'a bloqué : inconnue ; tu l'as bloquée : rien à signaler non plus (B.10 : « profil sans blocage »)
  const cible = await d.relations.trouverCompte(idPublic, compteId);
  if (cible === null || (cible !== compteId && (await d.relations.bloqueEntre(compteId, cible, tx)))) return null;
  const compte = await tx.compte.findUnique({ where: { id: cible }, select: { pseudo: true, prenom: true, avatar: true } });
  if (!compte) return null;
  return { contenu: { cible: "profil", pseudo: compte.pseudo, prenom: compte.prenom, avatar: compte.avatar }, auteurContenuId: cible, lieuId: null, fichierMedia: null };
}

async function lireSortie(tx: TransactionSociale, compteId: number, id: number): Promise<ContenuLu | null> {
  const s = await tx.sortie.findUnique({
    where: { id },
    select: {
      titre: true, emoji: true, quand: true, organisateurId: true,
      propositions: { select: { lieuId: true }, orderBy: [{ creeLe: "asc" }, { id: "asc" }] },
      invitations: { where: { compteId, statut: { in: ["invite", "accepte"] } }, select: { compteId: true } },
    },
  });
  if (!s || s.invitations.length === 0) return null;
  return {
    contenu: { cible: "sortie", titre: s.titre, emoji: s.emoji, quand: s.quand, lieux: s.propositions.map((p) => p.lieuId), organisateur: await lireAuteur(tx, s.organisateurId) },
    auteurContenuId: s.organisateurId, lieuId: null, fichierMedia: null,
  };
}

/**
 * Membre du groupe, ou invité en attente (I.13 a : entrer dans un groupe demande d'accepter) : l'invité voit déjà le titre et
 * l'emoji dans ses invitations, il peut les signaler sans entrer dans le groupe (ni messages ni membres dans l'instantané)
 */
async function lireGroupe(tx: TransactionSociale, d: DependancesInstantanes, compteId: number, id: number): Promise<ContenuLu | null> {
  const c = await tx.conversation.findFirst({
    where: { id, type: "groupe", OR: [{ membres: { some: { compteId } } }, { invitations: { some: { compteId, statut: "invite" } } }] },
    select: { titreChiffre: true, emoji: true, creeParId: true },
  });
  if (!c) return null;
  const titre = c.titreChiffre ? relire(() => d.chiffrement.dechiffrerTitre(c.titreChiffre!, id)) : null;
  return { contenu: { cible: "groupe", titre, emoji: c.emoji, createur: await lireAuteur(tx, c.creeParId) }, auteurContenuId: c.creeParId, lieuId: null, fichierMedia: null };
}

/** Le contenu signalé, s'il est visible pour `compteId` ; null : il n'existe pas pour lui (404 contenu-inconnu) */
export async function lireContenuSignale(
  tx: TransactionSociale, d: DependancesInstantanes, compteId: number, cible: CibleSignalementSocial, cibleId: string, maintenant: Date, o: OptionsLecture = {},
): Promise<ContenuLu | null> {
  if (cible === "profil") return lireProfil(tx, d, compteId, cibleId);
  const id = Number(cibleId);
  if (!Number.isSafeInteger(id) || id < 1) return null;
  switch (cible) {
    case "commentaire": return lireCommentaire(tx, id, maintenant, o);
    case "message": return lireMessage(tx, d, compteId, id, maintenant);
    case "liste": return lireListe(tx, d, compteId, id);
    case "sortie": return lireSortie(tx, compteId, id);
    case "groupe": return lireGroupe(tx, d, compteId, id);
  }
}

/** Écrit le signalement, puis, avec son id (le contexte du chiffrement), son instantané : une seule transaction. Rend l'id */
export async function ecrireSignalementSocial(
  tx: TransactionSociale, chiffrement: ChiffrementSocial, s: NouveauSignalementSocial, contenu: ContenuSignale, maintenant: Date,
): Promise<number> {
  const { id } = await tx.signalement.create({
    data: {
      cible: s.cible, cibleId: s.cibleId, lieuId: s.lieuId, raison: s.raison, precision: s.precision, explication: s.explication, source: s.source,
      signaleParId: s.signaleParId, auteurContenuId: s.auteurContenuId, fichierMedia: s.fichierMedia, creeLe: maintenant,
    },
    select: { id: true },
  });
  await tx.signalement.update({ where: { id }, data: { instantaneChiffre: chiffrement.chiffrerInstantane(construireInstantane(contenu), id) } });
  return id;
}

/** Un « choquant » retenu tout de suite : masqué pour tous en attendant la modération (un message fait bouger sa conversation) */
export async function masquerPourTous(tx: TransactionSociale, cible: SignalementSocialValide["cible"], id: number, maintenant: Date): Promise<void> {
  if (cible === "commentaire") await tx.commentairePublication.updateMany({ where: { id, suspenduLe: null }, data: { suspenduLe: maintenant } });
  else if (cible === "liste") await tx.listeLieux.updateMany({ where: { id, suspendueLe: null }, data: { suspendueLe: maintenant } });
  else if (cible === "message") {
    const message = await tx.messageConversation.update({ where: { id }, data: { suspenduLe: maintenant }, select: { conversationId: true } });
    // L'app relit la discussion quand sa version bouge (C.2) : le message y devient « masqué »
    await tx.conversation.update({ where: { id: message.conversationId }, data: { version: { increment: 1 }, modifieLe: maintenant } });
  }
}

/**
 * Les rejets passés sur ce contenu (même cible, même cibleId), quelle que soit sa date : « aucun rejet passé sur ce contenu »
 * (réponse de Hugo du 14/10/2026, I.18 a), même si le texte ou les lieux d'une liste ont changé depuis. source : seulement
 * ceux du gérant du lieu (deja-examine du masquage par le lieu).
 */
export async function compterRejets(tx: TransactionSociale, cible: string, cibleId: string, source?: "lieu"): Promise<number> {
  return tx.signalement.count({ where: { cible, cibleId, statut: "rejete", ...(source ? { source } : {}) } });
}
