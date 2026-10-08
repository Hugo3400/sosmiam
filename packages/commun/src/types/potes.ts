// Potes : sorties entre amis avec vote et discussion, listes partagées, activité, recommandations de lieux.
// Pour l'instant gardé sur le téléphone, avec des potes d'exemple (démo) ; plus tard, servi par l'API.

/** Le profil communautaire d'une personne, tel que ses potes le voient. */
export type Pote = {
  id: string;
  /** Pseudo unique, sans « @ » */
  pseudo: string;
  prenom: string;
  /** Emoji d'avatar */
  avatar: string;
  ville: string;
  /** 15 à 17 ans : pas d'alcool, et un adulte ne peut l'ajouter que par lien ou QR code */
  mineur: boolean;
  /** Points du programme Ambassadeurs */
  points: number;
  /** Points et rescousses du mois en cours (classement entre potes) */
  pointsDuMois: number;
  rescoussesDuMois: number;
  lieuxSauves: number[];
  gardes: number[];
  badges: string[];
};

/** Un lieu proposé pour une sortie, et qui a voté pour lui (identifiants ; « moi » pour soi). Chacun peut voter pour plusieurs lieux. */
export type PropositionSortie = { lieuId: number; proposePar: string; votes: string[] };

export type MessageSortie = { id: string; auteur: string; texte: string; date: string };

export type Sortie = {
  id: string;
  titre: string;
  emoji: string;
  /** Jour et heure de la sortie (ISO) */
  quand: string;
  organisateur: string;
  /** Tous les participants, organisateur et « moi » compris */
  participants: string[];
  propositions: PropositionSortie[];
  /** Fin du vote (ISO) */
  finVote: string;
  /** Lieu retenu à la fin du vote (null tant que le vote court) */
  lieuChoisi: number | null;
  messages: MessageSortie[];
};

export type ListePartagee = {
  id: string;
  titre: string;
  emoji: string;
  description: string;
  auteur: string;
  lieux: number[];
  abonnes: string[];
};

/** Ce que font les potes (« Léa a sauvé Chez Nonna Lia ») */
export type ActivitePote = {
  id: string;
  pote: string;
  type: "rescousse" | "garde" | "badge" | "palier" | "liste" | "sortie";
  lieuId?: number;
  /** Nom du badge, du palier ou de la liste */
  detail?: string;
  date: string;
};

/** Un lieu envoyé d'un pote à un autre (« Envoyer à un pote ») */
export type Recommandation = { id: string; de: string; a: string; lieuId: number; mot?: string; date: string; vue: boolean };
