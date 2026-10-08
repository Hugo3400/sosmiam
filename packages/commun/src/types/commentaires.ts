// Commentaires sous les publications du fil. Pour l'instant gardés sur le téléphone (démo) ; plus tard, servis par l'API.

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
};
