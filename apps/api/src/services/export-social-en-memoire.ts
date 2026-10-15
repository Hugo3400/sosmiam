// Double en mémoire de l'export de tes données sociales (contrat et mise en forme dans export-social-regles.ts), posé sur les
// tables partagées : mêmes filtres que la version Prisma (export-social.ts). Les blocages sont lus par la mise en forme ; les
// limitations, par un double (creerLimitationsEnMemoire) quand on le donne.
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import {
  creerServicesExportSocial, type DonneesExportSocial, type ListerLimitationsExport, type ServicesExportSocial,
} from "./export-social-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import type { TablesSociales } from "./tables-sociales-en-memoire.ts";

export function lireDonneesExportSocialEnMemoire(tables: TablesSociales, compteId: number): DonneesExportSocial {
  const membre = new Set(tables.membres.filter((m) => m.compteId === compteId).map((m) => m.conversationId));
  const messages = [...tables.messages.values()].filter((m) => m.auteurId === compteId);
  const invitationsGroupes = tables.invitationsGroupes.filter((i) => i.compteId === compteId);
  const conversationIds = new Set([...membre, ...messages.map((m) => m.conversationId), ...invitationsGroupes.map((i) => i.conversationId)]);
  const invitationsSorties = tables.invitationsSorties.filter((i) => i.compteId === compteId);
  // Les sorties où ton invitation attend ta réponse ou est acceptée ; quittée, elle n'a plus ton invitation
  const avecMonInvitation = new Set(invitationsSorties.filter((i) => i.statut === "invite" || i.statut === "accepte").map((i) => i.sortieId));
  const coAuteur = tables.coAuteurs.filter((c) => c.compteId === compteId && c.statut === "accepte").map((c) => c.listeId);
  const abonnementsListes = tables.abonnementsListes.filter((a) => a.compteId === compteId).map((a) => a.listeId);
  const listes = [...tables.listes.values()].filter((l) => l.auteurId === compteId || coAuteur.includes(l.id) || abonnementsListes.includes(l.id));
  const sortieDe = (conversationId: number) => [...tables.sorties.values()].find((s) => s.conversationId === conversationId);
  return {
    profil: tables.profils.get(compteId) ?? null,
    bande: tables.bande.filter((b) => b.compteId === compteId),
    demandesEnvoyees: tables.demandes.filter((x) => x.deId === compteId),
    demandesRecues: tables.demandes.filter((x) => x.aId === compteId && x.refuseeLe === null),
    abonnements: tables.suivis.filter((s) => s.suiveurId === compteId),
    abonnes: tables.suivis.filter((s) => s.suiviId === compteId && s.statut === "accepte"),
    demandesSuiviRecues: tables.suivis.filter((s) => s.suiviId === compteId && s.statut === "demande"),
    conversations: [...conversationIds].flatMap((id) => {
      const c = tables.conversations.get(id);
      return c ? [{ ...c, titreSortie: sortieDe(id)?.titre ?? null }] : [];
    }),
    membres: tables.membres.filter((m) => membre.has(m.conversationId)),
    messages,
    invitationsGroupes,
    reactions: tables.reactions.filter((r) => r.compteId === compteId),
    sorties: [...tables.sorties.values()].filter((s) => avecMonInvitation.has(s.id)),
    invitationsSorties,
    participantsSorties: tables.invitationsSorties.filter((i) => i.statut === "accepte" && avecMonInvitation.has(i.sortieId)),
    propositions: [...tables.propositions.values()].filter((p) => p.proposeParId === compteId),
    votes: tables.votes.filter((v) => v.compteId === compteId).flatMap((v) => {
      const p = tables.propositions.get(v.propositionId);
      return p ? [{ sortieId: p.sortieId, lieuId: p.lieuId }] : [];
    }),
    listes: listes.map((l) => ({ ...l, auteurPrive: tables.comptes.get(l.auteurId)?.prive ?? false })),
    coAuteur,
    abonnementsListes,
    lieuxListes: tables.lieuxListes.filter((l) => listes.some((x) => x.id === l.listeId)),
    commentaires: [...tables.commentaires.values()].filter((c) => c.auteurId === compteId),
    jaimesCommentaires: tables.jaimesCommentaires.filter((j) => j.compteId === compteId).map((j) => j.commentaireId),
    cloche: [...tables.cloche.values()].filter((n) => n.compteId === compteId),
    signalements: [...tables.signalements.values()].filter((s) => s.signaleParId === compteId),
    masques: tables.masques.filter((m) => m.compteId === compteId),
  };
}

/** listerLimitations : absente, l'export n'a pas de champ « limitations » (social-app-en-memoire.ts ne le donne pas encore) */
export function creerExportSocialEnMemoire(
  tables: TablesSociales, relations: RelationsSociales, chiffrement: ChiffrementSocial | null, listerLimitations?: ListerLimitationsExport,
): ServicesExportSocial {
  return creerServicesExportSocial({ lire: async (compteId) => lireDonneesExportSocialEnMemoire(tables, compteId), relations, chiffrement, listerLimitations });
}
