// Chat entre potes : messages privés (1-à-1) et groupes, tels que les écrans de l'app les lisent. Démo : gardé sur le
// téléphone ; compte connecté : converti depuis l'API (types/messagerie.ts), avec les champs facultatifs ci-dessous.

/** Réactions possibles sur un message */
export const REACTIONS_CHAT = ["❤️", "😂", "🤤", "👍", "😮"] as const;
export type ReactionChat = (typeof REACTIONS_CHAT)[number];

export type MessageChat = {
  id: string;
  /** Identifiant d'un pote, ou « moi » */
  auteur: string;
  /** Date d'envoi (ISO) */
  date: string;
  type: "texte" | "lieu" | "photo" | "vocal";
  texte?: string;
  /** Lieu partagé (type « lieu ») */
  lieuId?: number;
  /** Fichier de la photo ou de la note vocale, gardé dans les fichiers de l'app */
  fichier?: string;
  /** Durée d'une note vocale, en secondes */
  dureeSecondes?: number;
  /** Qui a réagi, par réaction (identifiants, « moi » compris) */
  reactions: Partial<Record<ReactionChat, string[]>>;
  /**
   * Compte connecté : l'idClient de l'envoi (tiré une fois, renvoyé tel quel), et l'état du message. « envoi » : parti, pas
   * encore confirmé ; « echec » : pas parti (toucher pour réessayer) ; « supprime » : supprimé par son auteur ; « masque » /
   * « retire » : par la modération ; « illisible » : le serveur n'a pas pu le relire. Absent : visible
   */
  idClient?: string;
  etat?: "envoi" | "echec" | "supprime" | "masque" | "retire" | "illisible";
  /** Compte connecté : la photo ou la note vocale sur le serveur (« expire » : effacée 90 jours après l'envoi) */
  media?: { etat: "disponible" | "expire"; largeur: number | null; hauteur: number | null; dureeSecondes: number | null };
};

export type Conversation = {
  id: string;
  type: "prive" | "groupe";
  /** Nom et emoji d'un groupe (absents pour un message privé) */
  titre?: string;
  emoji?: string;
  /** Tous les participants, « moi » compris */
  participants: string[];
  creePar: string;
  messages: MessageChat[];
  /** Jusqu'où tu as lu (ISO), pour les messages non lus */
  luJusqua?: string;
  /** Compte connecté : les non-lus comptés par le serveur (99 au plus) */
  nonLus?: number;
  /** Compte connecté : tu peux écrire (privé : vous êtes potes et personne n'a bloqué l'autre ; groupe : tu en es membre) */
  ouverte?: boolean;
  /** Compte connecté : tu as coupé ses notifications */
  coupee?: boolean;
  /** Compte connecté : les admins d'un groupe, et les invités qui n'ont pas encore répondu (identifiants publics) */
  admins?: string[];
  invites?: string[];
  /** Compte connecté : il reste des messages plus anciens à charger */
  plusAnciens?: boolean;
};

/** Une invitation à rejoindre un groupe (compte connecté) : on n'y entre qu'en acceptant (décision de Hugo du 14/10/2026) */
export type InvitationGroupeChat = {
  /** L'identifiant de la conversation du groupe */
  id: string;
  titre: string | null;
  emoji: string | null;
  /** Qui t'a invité (identifiant public), ou null s'il a supprimé son compte */
  invitePar: string | null;
  /** Combien de membres l'ont déjà rejoint (jamais leurs noms) */
  membres: number;
  date: string;
};
