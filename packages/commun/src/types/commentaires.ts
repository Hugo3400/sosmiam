// Commentaires sous les publications du fil. Commentaire : la démo, gardée sur le téléphone ; CommentaireApi : la forme
// rendue par l'API (contenu public, lisible sans compte).
import type { PersonneResume } from "./social.ts";

export type Commentaire = {
  id: string;
  publicationId: string;
  /** Identifiant d'un pote, « moi », ou « lieu » quand c'est le lieu de la publication qui répond (mis en avant) */
  auteur: string;
  texte: string;
  /** Date d'envoi (ISO) */
  date: string;
  /** Date de la dernière modification par son auteur (ISO) */
  modifieLe?: string;
  /** Qui l'a aimé (identifiants, « moi » compris) */
  jaimes: string[];
  /** Commentaire auquel il répond (un seul niveau de réponses) */
  reponseA?: string;
  /** Pseudos mentionnés avec « @ » */
  mentions: string[];
  /** Masqué par le lieu : il part à la modération et ne s'affiche plus, sauf à son auteur */
  masqueParLieu?: boolean;
  /**
   * Visite et compte connecté : ce que dit le serveur, quand la démo le calcule à partir des champs ci-dessus (jaimes y
   * reste vide, mentions garde les pseudos)
   */
  serveur?: {
    /** Qui l'a écrit (null : le lieu, ou un compte supprimé) : de quoi l'afficher sans le chercher dans la communauté */
    personne: PersonneResume | null;
    nombreJaimes: number;
    aimeParMoi: boolean;
    /** « Commentaire supprimé » : il a encore des réponses (texte vide) */
    supprime: boolean;
    /** Vu par son auteur seul : masqué par le lieu, ou suspendu en attendant la modération */
    etat: "masque-par-le-lieu" | "suspendu" | null;
    /** Les @ retrouvés à l'écriture : le pseudo tel qu'écrit, et le profil qu'ouvre le lien */
    mentions: { pseudo: string; id: string }[];
  };
};

export type CommentaireApi = {
  id: string;
  publicationId: string;
  auteur: { type: "personne"; personne: PersonneResume } | { type: "lieu" };
  /** "" pour un commentaire supprimé qui a encore des réponses */
  texte: string;
  date: string;
  modifieLe: string | null;
  /** « Commentaire supprimé » (il a encore des réponses) */
  supprime: boolean;
  jaimes: number;
  /** null : premier niveau (ou le commentaire auquel il répondait est parti avec son auteur) */
  reponseA: string | null;
  /** Les @ retrouvés à l'écriture : le pseudo tel qu'écrit, et l'identifiant public qu'ouvre le lien */
  mentions: { pseudo: string; id: string }[];
  /** Seulement dans MesCommentairesApi.miens */
  etat?: "masque-par-le-lieu" | "suspendu";
};

export type MesCommentairesApi = { jaimes: string[]; miens: CommentaireApi[]; signales: string[]; peutRepondreCommeLieu: boolean };
