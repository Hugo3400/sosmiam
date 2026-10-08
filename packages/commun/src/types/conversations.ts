// Chat entre potes : messages privés (1-à-1) et groupes. Démo gardée sur le téléphone en attendant l'API.

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
};
