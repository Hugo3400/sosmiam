// Contrat des sorties entre potes (compte connecté), mêmes routes que l'API (/app/sorties). Chaque invité accepte (« Tu
// viens ? ») avant d'entrer dans le vote et la discussion ; la discussion est une conversation (SortieApi.conversationId,
// lue par le service de la messagerie). Une sortie se relit avec sa version : { inchange: true } si rien n'a bougé.

import type { InvitationSortieApi, NouvelleSortieApi, SortieApi } from "../types/sorties.ts";
import type { ReponseApi } from "./reponse-api.ts";

/** GET /app/sorties/:id : la sortie (participant), l'invitation (invité pas encore décidé), ou rien de neuf */
export type LectureSortieApi = { sortie: SortieApi } | { invitation: InvitationSortieApi } | { inchange: true; version: number };

export interface ServiceSorties {
  /** Tes sorties (à venir d'abord, de la plus proche à la plus lointaine, puis les passées) et les invitations à venir */
  lister(): Promise<ReponseApi<{ sorties: SortieApi[]; invitations: InvitationSortieApi[] }>>;
  /** version : celle que l'app a déjà ; la réponse est alors { inchange: true, version } si rien n'a bougé */
  lire(id: string, version?: number): Promise<ReponseApi<LectureSortieApi>>;
  /** cle : Idempotency-Key tirée à l'ouverture de la feuille (un second envoi rend la sortie déjà créée, sans prévenir personne) */
  creer(s: NouvelleSortieApi, cle: string): Promise<ReponseApi<{ sortie: SortieApi }>>;
  /** « Carrément ! » (vient : vrai, la sortie est rendue) ou « Pas cette fois » (sans prévenir personne) */
  repondre(id: string, vient: boolean): Promise<ReponseApi<{ sortie?: SortieApi }>>;
  /** L'organisateur invite d'autres potes de sa bande (identifiants publics) */
  inviter(id: string, invites: string[]): Promise<ReponseApi<{ sortie: SortieApi }>>;
  /** Proposer un lieu (on vote d'office pour lui) ; deja : il était déjà proposé */
  proposer(id: string, lieuId: number): Promise<ReponseApi<{ sortie: SortieApi; deja?: boolean }>>;
  voter(id: string, lieuId: number, oui: boolean): Promise<ReponseApi<{ sortie: SortieApi }>>;
  /** L'organisateur clôt le vote tout de suite : le lieu retenu est choisi */
  terminerVote(id: string): Promise<ReponseApi<{ sortie: SortieApi }>>;
  /** Quitter la sortie (et sa discussion) ; l'organisateur qui part passe la main au plus ancien participant */
  quitter(id: string): Promise<ReponseApi>;
  /** L'organisateur retire un participant ou une invitation en attente, sans prévenir */
  retirerParticipant(id: string, personne: string): Promise<ReponseApi>;
  /** L'organisateur annule : la sortie et sa discussion sont effacées */
  annuler(id: string): Promise<ReponseApi>;
}
