import type { CommentaireIdee } from "@sos-miam/commun/types/idees";

export function basculerJaimeCommentaireIdee(commentaire: CommentaireIdee, oui: boolean): CommentaireIdee {
  if (commentaire.aime === oui) return commentaire;
  return { ...commentaire, aime: oui, jaime: Math.max(0, commentaire.jaime + (oui ? 1 : -1)) };
}
