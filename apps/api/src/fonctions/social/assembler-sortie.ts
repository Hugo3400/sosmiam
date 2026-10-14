import { choisirOrganisateurSortie } from "../../../../../packages/commun/src/fonctions/sorties/choisir-organisateur-sortie.ts";
import type { InvitationSortie, PropositionSortie, Sortie } from "../../base-de-donnees/client-genere/client.ts";

/** Les lignes d'une sortie telles que la base (ou le double en mémoire) les rend */
export type LignesSortie = {
  sortie: Pick<Sortie, "id" | "titre" | "emoji" | "quand" | "finVote" | "organisateurId" | "lieuChoisiId" | "voteTermineLe" | "version" | "conversationId">;
  invitations: Pick<InvitationSortie, "compteId" | "statut" | "inviteParId" | "creeLe" | "reponduLe">[];
  /** Avec les comptes qui ont voté pour chacune */
  propositions: (Pick<PropositionSortie, "id" | "lieuId" | "proposeParId"> & { votants: number[] })[];
};

/** Une sortie prête à juger (droits, lieu retenu) et à présenter (presenterSortie) */
export type DonneesSortie = LignesSortie["sortie"] & {
  /** L'organisateur qui a la main : le sien s'il est encore participant, sinon le plus ancien participant ; null : plus personne */
  organisateurEffectif: number | null;
  /** Les invitations acceptées (organisateur compris), par ordre d'arrivée */
  participants: number[];
  /** Les invitations en attente, par ordre d'invitation */
  invites: number[];
  /** Ceux qui ont refusé (gardés jusqu'à la date : on ne les réinvite pas) */
  refus: number[];
  /** Par ordre de proposition (le premier proposé l'emporte à égalité), seulement les lieux encore publiés ; votants : les
   *  participants seulement (le vote de celui qui est parti, retiré ou bloqué ne compte plus) */
  propositions: { lieuId: number; proposeParId: number | null; votants: number[] }[];
};

/** Arrivée d'un participant : sa réponse (« Je viens »), sinon son invitation */
const arrivee = (i: { creeLe: Date; reponduLe: Date | null }) => (i.reponduLe ?? i.creeLe).getTime();

/**
 * Range les lignes d'une sortie : participants par ordre d'arrivée (à égalité, le plus petit compte), invitations en
 * attente, refus, propositions des lieux encore publiés dans l'ordre où ils ont été proposés (votes des participants
 * seulement), et l'organisateur qui a la main (choisirOrganisateurSortie : son compte supprimé ou parti, c'est le plus
 * ancien participant).
 */
export function assemblerSortie(l: LignesSortie, lieuxPublies: ReadonlySet<number>): DonneesSortie {
  const acceptees = l.invitations
    .filter((i) => i.statut === "accepte")
    .sort((a, b) => arrivee(a) - arrivee(b) || a.compteId - b.compteId);
  const participants = acceptees.map((i) => i.compteId);
  const participe = new Set(participants);
  const parInvitation = (statut: string) => l.invitations
    .filter((i) => i.statut === statut)
    .sort((a, b) => a.creeLe.getTime() - b.creeLe.getTime() || a.compteId - b.compteId)
    .map((i) => i.compteId);
  // Les identifiants passent en texte pour la fonction commune (ils ne sortent jamais d'ici) ; même ordre d'arrivée
  const choisi = choisirOrganisateurSortie(
    l.sortie.organisateurId === null ? null : String(l.sortie.organisateurId),
    acceptees.map((i) => ({ id: String(i.compteId), depuis: new Date(arrivee(i)).toISOString() })),
  );
  return {
    ...l.sortie,
    organisateurEffectif: choisi === null ? null : Number(choisi),
    participants,
    invites: parInvitation("invite"),
    refus: parInvitation("refuse"),
    propositions: [...l.propositions]
      .sort((a, b) => a.id - b.id)
      .filter((p) => lieuxPublies.has(p.lieuId))
      .map((p) => ({ lieuId: p.lieuId, proposeParId: p.proposeParId, votants: [...new Set(p.votants)].filter((id) => participe.has(id)) })),
  };
}
