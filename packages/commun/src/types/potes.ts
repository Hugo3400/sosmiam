// Potes : sorties entre amis avec vote et discussion, listes partagées, activité, recommandations de lieux.
// Pour l'instant gardé sur le téléphone, avec des potes d'exemple (démo) ; plus tard, servi par l'API.
import type { VisibiliteListe } from "./listes.ts";

/** Le profil communautaire d'une personne, tel que ses potes le voient. */
export type Pote = {
  id: string;
  /** Pseudo unique, sans « @ » */
  pseudo: string;
  prenom: string;
  /** Emoji d'avatar */
  avatar: string;
  ville: string;
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
/** nombreVotes (compte connecté) : tous les votes, même ceux qu'on ne te nomme pas (blocage) ; c'est lui qui décide */
export type PropositionSortie = { lieuId: number; proposePar: string; votes: string[]; nombreVotes?: number };

/**
 * etat (compte connecté, la discussion étant une conversation) : « envoi » (parti, pas encore confirmé), « echec » (pas parti,
 * toucher pour réessayer), « supprime », « masque », « retire » (modération) ou « illisible » ; texte dit alors ce qu'il en est
 */
export type MessageSortie = { id: string; auteur: string; texte: string; date: string; etat?: "envoi" | "echec" | "supprime" | "masque" | "retire" | "illisible" };

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
  /** Démo seulement : avec un compte, la discussion est la conversation conversationId (vide ici) */
  messages: MessageSortie[];
  /** Compte connecté : la discussion de la sortie, dans la messagerie */
  conversationId?: string;
  /** Compte connecté : les invités qui n'ont pas encore répondu */
  invites?: string[];
  /** Compte connecté : le vote est fini (clos par l'organisateur, ou l'heure est passée) */
  voteTermine?: boolean;
  /** Compte connecté : messages pas encore lus dans sa discussion */
  nonLus?: number;
};

export type ListePartagee = {
  id: string;
  titre: string;
  emoji: string;
  description: string;
  auteur: string;
  /** Compte connecté : vide tant que la liste n'est lue qu'en résumé (complete faux) ; nombreLieux dit combien */
  lieux: number[];
  /** Démo : qui la suit. Compte connecté : vide (le serveur ne donne que nombreAbonnes et moi.abonne) */
  abonnes: string[];
  /** « tous » ou « bande » (absent : « tous ») */
  visibilite?: VisibiliteListe;
  /** Ceux qui la remplissent avec l'auteur ; « invite » : pas encore répondu (vu de l'auteur et de l'invité) */
  coAuteurs?: { id: string; statut: "invite" | "accepte" }[];
  /** Compte connecté : ce que dit le serveur, quand la démo le calcule à partir des listes ci-dessus */
  serveur?: {
    nombreLieux: number;
    nombreAbonnes: number;
    /** Faux : seulement le résumé (lieux et co-auteurs pas encore lus) */
    complete: boolean;
    moi: { auteur: boolean; coAuteur: "invite" | "accepte" | null; abonne: boolean; peutRemplir: boolean };
    modifieLe: string;
    /** Suspendue ou retirée par la modération : seul l'auteur la voit, avec un bandeau */
    enModeration: boolean;
  };
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
