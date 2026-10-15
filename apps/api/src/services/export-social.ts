// Export de tes données sociales, version Prisma (contrat et mise en forme dans export-social-regles.ts) : les lignes de la
// personne, et seulement les siennes (ses messages, jamais ceux des autres ; jamais son code d'invitation). Les blocages ne
// sont pas lus ici : la mise en forme les lit une fois (relations.listerBlocages) et cache ceux qu'ils concernent. Les
// limitations du compte viennent du service de la session Site (limitations-comptes.ts), lu tel quel.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import {
  creerServicesExportSocial, type DonneesExportSocial, type ListerLimitationsExport, type ServicesExportSocial,
} from "./export-social-regles.ts";
import { creerLimitationsComptes, listerLimitationsDuCompte } from "./limitations-comptes.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";

type Base = typeof baseDeDonnees;

/** Les lignes sociales d'un compte, telles que l'export les met en forme */
export async function lireDonneesExportSocial(base: Base, compteId: number): Promise<DonneesExportSocial> {
  const parDate = { creeLe: "asc" } as const;
  const [profil, bande, demandesEnvoyees, demandesRecues, abonnements, abonnes, demandesSuiviRecues, membresMoi, messages, invitationsGroupes, reactions] = await Promise.all([
    base.profilSocial.findUnique({ where: { compteId }, select: { trouvable: true, suggerable: true, activitePartagee: true, pushSocial: true, creeLe: true } }),
    base.membreBande.findMany({ where: { compteId }, select: { poteId: true, creeLe: true }, orderBy: parDate }),
    base.demandeBande.findMany({ where: { deId: compteId }, select: { aId: true, creeLe: true }, orderBy: parDate }),
    base.demandeBande.findMany({ where: { aId: compteId, refuseeLe: null }, select: { deId: true, creeLe: true }, orderBy: parDate }),
    base.suiviPersonne.findMany({ where: { suiveurId: compteId }, select: { suiviId: true, statut: true, creeLe: true, accepteLe: true }, orderBy: parDate }),
    base.suiviPersonne.findMany({ where: { suiviId: compteId, statut: "accepte" }, select: { suiveurId: true, creeLe: true, accepteLe: true }, orderBy: parDate }),
    base.suiviPersonne.findMany({ where: { suiviId: compteId, statut: "demande" }, select: { suiveurId: true, creeLe: true }, orderBy: parDate }),
    base.membreConversation.findMany({ where: { compteId }, select: { conversationId: true } }),
    base.messageConversation.findMany({
      where: { auteurId: compteId },
      select: { id: true, conversationId: true, type: true, idClient: true, texteChiffre: true, taille: true, creeLe: true },
      orderBy: { id: "asc" },
    }),
    base.invitationGroupe.findMany({ where: { compteId }, select: { conversationId: true, inviteParId: true, statut: true, creeLe: true }, orderBy: parDate }),
    base.reactionMessage.findMany({ where: { compteId }, select: { messageId: true, reaction: true, creeLe: true }, orderBy: parDate }),
  ]);
  const membre = membresMoi.map((m) => m.conversationId);
  // Les sorties où ton invitation attend ta réponse ou est acceptée ; quittée, elle n'a plus ton invitation (même si tu l'as créée)
  const avecMonInvitation = { invitations: { some: { compteId, statut: { in: ["invite", "accepte"] } } } };
  const conversationIds = [...new Set([...membre, ...messages.map((m) => m.conversationId), ...invitationsGroupes.map((i) => i.conversationId)])];
  const [conversations, membres, sorties, invitationsSorties, participantsSorties, propositions, votes] = await Promise.all([
    base.conversation.findMany({ where: { id: { in: conversationIds } }, select: { id: true, type: true, titreChiffre: true, sortie: { select: { titre: true } } } }),
    base.membreConversation.findMany({ where: { conversationId: { in: membre } }, select: { conversationId: true, compteId: true }, orderBy: { arriveLe: "asc" } }),
    base.sortie.findMany({ where: avecMonInvitation, select: { id: true, titre: true, quand: true, organisateurId: true } }),
    base.invitationSortie.findMany({ where: { compteId }, select: { sortieId: true, statut: true, inviteParId: true } }),
    // Qui a la main sur ces sorties : un blocage avec lui cache une invitation (estInvitationCachee) ; toi, tu es « organisateur »
    base.invitationSortie.findMany({
      where: { statut: "accepte", sortie: avecMonInvitation },
      select: { sortieId: true, compteId: true, creeLe: true, reponduLe: true },
    }),
    base.propositionSortie.findMany({ where: { proposeParId: compteId }, select: { sortieId: true, lieuId: true } }),
    base.voteSortie.findMany({ where: { compteId }, select: { proposition: { select: { sortieId: true, lieuId: true } } } }),
  ]);
  const [listes, coAuteur, abonnementsListes, commentaires, jaimes, cloche, signalements, masques] = await Promise.all([
    base.listeLieux.findMany({
      where: { OR: [{ auteurId: compteId }, { coAuteurs: { some: { compteId, statut: "accepte" } } }, { abonnes: { some: { compteId } } }] },
      select: { id: true, titre: true, auteurId: true, visibilite: true, suspendueLe: true, retireeLe: true, auteur: { select: { prive: true } } },
    }),
    base.coAuteurListe.findMany({ where: { compteId, statut: "accepte" }, select: { listeId: true } }),
    base.abonnementListe.findMany({ where: { compteId }, select: { listeId: true } }),
    base.commentairePublication.findMany({ where: { auteurId: compteId }, select: { id: true, publicationId: true, texte: true, creeLe: true } }),
    base.jaimeCommentaire.findMany({ where: { compteId }, select: { commentaireId: true } }),
    base.notificationCloche.findMany({ where: { compteId }, select: { id: true, type: true, creeLe: true } }),
    base.signalement.findMany({
      where: { signaleParId: compteId },
      select: { id: true, cible: true, cibleId: true, raison: true, precision: true, explication: true, statut: true, creeLe: true },
    }),
    base.elementMasque.findMany({ where: { compteId }, select: { cible: true, cibleId: true, creeLe: true } }),
  ]);
  const lieuxListes = await base.lieuDeListe.findMany({
    where: { listeId: { in: listes.map((l) => l.id) } },
    select: { listeId: true, lieuId: true, ajouteParId: true },
  });
  return {
    profil, bande, demandesEnvoyees, demandesRecues, abonnements, abonnes, demandesSuiviRecues,
    conversations: conversations.map(({ sortie, ...c }) => ({ ...c, titreSortie: sortie?.titre ?? null })),
    membres, messages, invitationsGroupes, reactions, sorties, invitationsSorties, participantsSorties, propositions,
    votes: votes.map((v) => v.proposition),
    listes: listes.map(({ auteur, ...l }) => ({ ...l, auteurPrive: auteur.prive })),
    coAuteur: coAuteur.map((c) => c.listeId), abonnementsListes: abonnementsListes.map((a) => a.listeId), lieuxListes,
    commentaires, jaimesCommentaires: jaimes.map((j) => j.commentaireId), cloche, signalements, masques,
  };
}

/**
 * listerLimitations : par défaut, le service des limitations de la session Site sur la même base (celui de demarrer.ts
 * sur la vraie base) ; tant que la table n'existe pas, aucune limitation. Le passer seulement pour un autre branchement.
 */
export function creerExportSocial(o: {
  relations: RelationsSociales; chiffrement: ChiffrementSocial | null; base?: Base; listerLimitations?: ListerLimitationsExport;
}): ServicesExportSocial {
  const base = o.base ?? baseDeDonnees;
  const listerLimitations = o.listerLimitations ?? (o.base ? creerLimitationsComptes(o.base).listerLimitationsDuCompte : listerLimitationsDuCompte);
  return creerServicesExportSocial({
    lire: (compteId) => lireDonneesExportSocial(base, compteId), relations: o.relations, chiffrement: o.chiffrement, listerLimitations,
  });
}
