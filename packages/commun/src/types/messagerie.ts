// Messagerie entre potes telle que l'API la rend (décidé le 8 et le 14 octobre 2026) : privé, groupes et discussions des
// sorties, textes chiffrés par l'API, photos et notes vocales effacées 90 jours après l'envoi.
// Groupes (réponse de Hugo du 14/10/2026) : on n'y entre qu'en acceptant une invitation (« Rejoindre le groupe ? »), comme
// pour une sortie. Un invité ne voit ni les messages ni les membres avant d'accepter ; un refus est silencieux et noté.
import type { PersonneResume, StatutInvitation } from "./social.ts";

export type CodeReaction = "coeur" | "rire" | "miam" | "pouce" | "surprise";

export type TypeConversation = "prive" | "groupe" | "sortie";

/** « admin » : invite, retire, renomme et nomme d'autres admins (groupes seulement ; privé et sortie : toujours « membre ») */
export type RoleConversation = "admin" | "membre";

export type MediaMessageApi = {
  etat: "disponible" | "expire";
  typeMime: "image/jpeg" | "audio/mp4";
  taille: number;
  largeur: number | null;
  hauteur: number | null;
  dureeSecondes: number | null;
  expireLe: string;
  onde?: string;
};

export type MessageCiteApi = {
  id: string;
  auteurId: string | null;
  type: MessageApi["type"];
  extrait: string | null;
  etat: MessageApi["etat"];
};

export type MessageApi = {
  id: string;
  /** L'idClient de l'envoi : l'app retrouve ainsi son message « en cours d'envoi » */
  idClient: string;
  /** null : compte supprimé (« Compte supprimé »), ou message de SOS Miam (systeme présent) */
  auteur: PersonneResume | null;
  date: string;
  type: "texte" | "lieu" | "photo" | "vocal" | "vote" | "gif";
  /** Texte, ou mot d'un lieu envoyé ; null si l'état n'est pas « visible » */
  texte: string | null;
  /** Lieu d'un message « lieu » (déchiffré avec le mot) ; l'app dit « Ce lieu n'est plus là » s'il n'est plus publié */
  lieuId: number | null;
  media: MediaMessageApi | null;
  /** Qui a réagi (identifiants publics), par réaction */
  reactions: Partial<Record<CodeReaction, string[]>>;
  etat: "visible" | "supprime" | "masque" | "retire" | "illisible";
  reponseA?: MessageCiteApi;
  modifieLe?: string;
  album?: string;
  legende?: string;
  systeme?: string;
  mentions?: string[];
};

/** Un membre qui a accepté (ou le créateur) ; depuis : son arrivée, c'est-à-dire le moment où il a accepté */
export type MembreConversationApi = { personne: PersonneResume; role: RoleConversation; depuis: string; luJusqua?: string };

export type ConversationApi = {
  id: string;
  type: TypeConversation;
  /** Groupe : son titre, déchiffré ; sortie : le titre de la sortie ; privé : null */
  titre: string | null;
  emoji: string | null;
  /** Ceux qui ont accepté, toi compris (jamais les invités en attente) */
  membres: MembreConversationApi[];
  /** Groupe : les invitations en attente, vues des membres ; [] pour un privé et une sortie (les invités d'une sortie sont dans SortieApi) */
  invites: PersonneResume[];
  /** Privé seulement : l'autre personne ; null : elle a supprimé son compte (« Compte supprimé ») */
  autre: PersonneResume | null;
  dernierMessage: MessageApi | null;
  dernierMessageLe: string;
  /** 99 au plus */
  nonLus: number;
  luJusqua: string | null;
  coupee: boolean;
  /** Tu peux écrire (privé : vous êtes potes et personne n'a bloqué l'autre ; groupe et sortie : tu en es membre) */
  ouverte: boolean;
  moi: { role: RoleConversation };
  sortieId: string | null;
  version: number;
  epinglee?: boolean;
  photo?: boolean;
};

/**
 * Ce que voit une personne invitée dans un groupe, avant de répondre (« Rejoindre le groupe ? ») : ni les messages, ni les
 * noms des membres. Son id est celui de la conversation du groupe.
 */
export type InvitationGroupeApi = {
  id: string;
  /** Titre du groupe, déchiffré ; null s'il est illisible */
  titre: string | null;
  emoji: string | null;
  /** null : la personne qui t'a invité a supprimé son compte */
  invitePar: PersonneResume | null;
  /** Combien de membres l'ont déjà rejoint (jamais leurs noms) */
  membres: number;
  date: string;
};

/** Une ligne de membre telle que les règles la lisent (peutAdministrerGroupe) : identifiant public, rôle, arrivée, statut */
export type MembreGroupe = { id: string; role: RoleConversation; depuis: string; statut: StatutInvitation };

/** POST /app/conversations/groupes : invites, 1 à 19 potes de ta bande, qui reçoivent chacun une invitation à accepter */
export type NouveauGroupeApi = { titre: string; emoji: string; invites: string[] };

/** Réponse à une invitation dans un groupe : oui, on entre (on voit la suite, pas l'historique) ; non, en silence */
export type ReponseInvitationGroupeApi = { rejoint: boolean };

export type FilMessagesApi = { conversation: ConversationApi; messages: MessageApi[]; suite: string | null; version: number };

/** invitations : les invitations à des groupes qui attendent ta réponse (première page seulement ; [] ensuite) */
export type PageConversationsApi = { conversations: ConversationApi[]; invitations: InvitationGroupeApi[]; suite: string | null; epinglees?: ConversationApi[] };

export type TypePartage = "photo" | "lieu";

export type PagePartagesApi = { messages: MessageApi[]; suite: string | null };

/** Un lieu envoyé = un message « lieu » d'une discussion privée */
export type LieuEnvoyeApi = {
  id: string;
  conversationId: string;
  de: PersonneResume | null;
  a: PersonneResume | null;
  lieuId: number;
  mot: string | null;
  date: string;
  vu: boolean;
};
