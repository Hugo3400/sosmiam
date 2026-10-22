// Contrat de la messagerie de l'app (compte connecté), mêmes routes que l'API (/app/conversations, /app/lieux-envoyes) :
// privé, groupes, discussions des sorties, messages, photos et notes vocales, lieux envoyés (« Envoyer à un pote »). Une
// personne est désignée par son identifiant public. On n'entre dans un groupe qu'en ACCEPTANT une invitation (réponse de
// Hugo du 14/10/2026) : un invité voit l'invitation (InvitationGroupeApi), ni les messages ni les membres. Chaque envoi porte
// un idClient (UUID v4) tiré UNE fois par l'app et renvoyé tel quel à chaque essai : un envoi rejoué ne crée rien de plus.
// Aucune règle d'âge : l'app est réservée aux majeurs.

import type {
  CodeReaction, ConversationApi, FilMessagesApi, InvitationGroupeApi, LieuEnvoyeApi, MessageApi, NouveauGroupeApi,
  PageConversationsApi, PagePartagesApi, RoleConversation, TypePartage,
} from "../types/messagerie.ts";
import type { ReponseApi } from "./reponse-api.ts";

/** Un fil : les messages, ou rien de changé (même version), ou l'invitation d'un groupe pas encore rejoint */
export type ReponseFil = ReponseApi<{ fil: FilMessagesApi } | { inchange: true; version: number } | { invitation: InvitationGroupeApi }>;
export type ReponseMessage = ReponseApi<{ message: MessageApi; version: number }>;
/** Une page de lieux reçus ou envoyés ; suite : à renvoyer telle quelle pour la page d'après */
export type PageLieuxEnvoyes = { lieux: LieuEnvoyeApi[]; suite: string | null };

export interface ServiceMessagerie {
  /** GET /app/conversations[?apres=] : 30 par page ; invitations aux groupes avec la première page seulement */
  listerConversations(apres?: string): Promise<ReponseApi<PageConversationsApi>>;
  /** GET /app/conversations/:id[?version=][&avant=] : avant, la `suite` du fil pour les plus anciens. « conversation-inconnue » */
  lireFil(id: string, o?: { version?: number; avant?: string }): Promise<ReponseFil>;
  /** POST /app/conversations/prive : « personne-inconnue », « pas-dans-la-bande » */
  ouvrirPrive(personne: string): Promise<ReponseApi<{ conversation: ConversationApi }>>;
  /**
   * POST /app/conversations/groupes : chaque invité de ta bande reçoit une invitation à accepter ; ignores : ceux qui n'ont pas
   * pu être invités. cle : Idempotency-Key tirée à l'ouverture de la feuille (deux « Créer » ne font qu'un groupe).
   * « pas-dans-la-bande », « groupe-plein », « message-refuse » { champ: "titre" }
   */
  creerGroupe(g: NouveauGroupeApi, cle: string): Promise<ReponseApi<{ conversation: ConversationApi; ignores: string[] }>>;
  /** PATCH /app/conversations/:id : admins. « reserve-aux-admins », « geree-par-la-sortie » */
  modifierGroupe(id: string, m: { titre?: string; emoji?: string }): Promise<ReponseApi<{ conversation: ConversationApi }>>;
  /** POST /app/conversations/:id/invites : un admin invite des potes de sa bande (ignorés sans dire pourquoi) */
  inviterAuGroupe(id: string, invites: string[]): Promise<ReponseApi<{ conversation: ConversationApi; ignores: string[] }>>;
  /** POST /app/conversations/:id/reponse : « Rejoindre le groupe ? » ; non : en silence. « invitation-inconnue » */
  repondreInvitation(id: string, rejoint: boolean): Promise<ReponseApi<{ rejoint: boolean; conversation?: ConversationApi }>>;
  /** DELETE /app/conversations/:id/membres/:personne : un admin retire un membre ou une invitation ; "moi" : quitter le groupe */
  retirerMembre(id: string, personne: string | "moi"): Promise<ReponseApi>;
  changerRole(id: string, personne: string, role: RoleConversation): Promise<ReponseApi<{ conversation: ConversationApi }>>;
  couper(id: string, coupees: boolean): Promise<ReponseApi>;
  /** PUT /app/conversations/:id/lu : ne recule jamais ; montré aux autres membres (« Vu ») seulement si vous avez tous les deux les accusés de lecture */
  marquerLu(id: string, jusqua: string): Promise<ReponseApi>;
  effacerPourMoi(id: string): Promise<ReponseApi>;
  /** idClient : tiré une fois par message, renvoyé tel quel à chaque essai. « conversation-fermee », « message-refuse » */
  envoyerTexte(id: string, idClient: string, texte: string, o?: { reponseA?: string }): Promise<ReponseMessage>;
  modifierMessage(id: string, messageId: string, texte: string): Promise<ReponseMessage>;
  /** Un lieu publié dans la discussion, avec un petit mot (140 caractères). « lieu-inconnu » */
  envoyerLieu(id: string, idClient: string, lieuId: number, texte?: string | null): Promise<ReponseMessage>;
  /**
   * POST /app/conversations/:id/medias : photo JPEG (réduite à 2 048 px par l'app) ou note vocale M4A, jamais mise en attente.
   * « media-trop-lourd », « media-invalide » { champ }, « format-refuse », « trop-de-medias », « stockage-plein »
   */
  envoyerMedia(
    id: string, idClient: string, corps: Blob | ArrayBuffer | Uint8Array, typeMime: "image/jpeg" | "audio/mp4", o?: { album?: string; legende?: string; onde?: string },
  ): Promise<ReponseMessage>;
  /** Adresse et en-têtes (session comprise) pour que le téléphone télécharge le média lui-même ; 410 : « media-expire » */
  preparerLectureMedia(id: string, messageId: string): Promise<{ url: string; entetes: Record<string, string> }>;
  supprimerMessage(id: string, messageId: string): Promise<ReponseApi<{ version: number }>>;
  reagir(id: string, messageId: string, reaction: CodeReaction, oui: boolean): Promise<ReponseApi<{ version: number }>>;
  epingler(id: string, epinglee: boolean): Promise<ReponseApi>;
  envoyerPhotoGroupe(id: string, corps: Blob | ArrayBuffer | Uint8Array): Promise<ReponseApi<{ conversation: ConversationApi }>>;
  retirerPhotoGroupe(id: string): Promise<ReponseApi<{ conversation: ConversationApi }>>;
  preparerLecturePhotoGroupe(id: string): Promise<{ url: string; entetes: Record<string, string> }>;
  listerPartages(id: string, type: TypePartage, avant?: string): Promise<ReponseApi<PagePartagesApi>>;
  /** POST /app/lieux-envoyes : un message « lieu » dans le privé de chaque pote (1 à 20) ; même idClient pour tous */
  envoyerLieuAPotes(idClient: string, lieuId: number, a: string[], mot?: string | null): Promise<ReponseApi<{ envoyes: LieuEnvoyeApi[]; ignores: string[] }>>;
  listerLieuxRecus(apres?: string): Promise<ReponseApi<PageLieuxEnvoyes>>;
  listerLieuxEnvoyes(apres?: string): Promise<ReponseApi<PageLieuxEnvoyes>>;
  /** PUT /app/lieux-envoyes/vus : ne recule jamais */
  marquerLieuxVus(jusqua: string): Promise<ReponseApi>;
}
