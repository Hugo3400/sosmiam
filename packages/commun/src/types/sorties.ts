// Sorties entre potes telles que l'API les rend (décidé le 8 et le 14 octobre 2026) : chaque invité accepte (« Tu viens ? »)
// avant d'entrer dans le vote et la discussion. La discussion est une conversation (conversationId, types/messagerie.ts).
import type { PersonneResume } from "./social.ts";

/** votes : les personnes visibles pour toi ; nombreVotes : tous les votes (c'est lui qui décide du lieu retenu) */
export type PropositionSortieApi = { lieuId: number; proposePar: PersonneResume | null; votes: PersonneResume[]; nombreVotes: number };

export type SortieApi = {
  id: string;
  titre: string;
  emoji: string;
  quand: string;
  finVote: string;
  organisateur: PersonneResume | null;
  /** Acceptés, organisateur compris, par ordre d'arrivée */
  participants: PersonneResume[];
  /** Invitations en attente (vues des participants) */
  invites: PersonneResume[];
  propositions: PropositionSortieApi[];
  lieuChoisi: number | null;
  voteTermine: boolean;
  conversationId: string;
  nonLus: number;
  version: number;
  moi: { organisateur: boolean };
};

/** Ce que voit un invité qui n'a pas encore répondu : ni les propositions, ni les votes, ni la discussion */
export type InvitationSortieApi = {
  id: string;
  titre: string;
  emoji: string;
  quand: string;
  organisateur: PersonneResume | null;
  invitePar: PersonneResume | null;
  participants: number;
  date: string;
};

/** POST /app/sorties ; invites : identifiants publics de potes de ta bande ; lieux : identifiants de lieux publiés */
export type NouvelleSortieApi = { titre: string; emoji: string; quand: string; finVote: string; invites: string[]; lieux: number[] };
