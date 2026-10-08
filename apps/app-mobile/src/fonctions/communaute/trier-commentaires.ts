import type { Commentaire } from "@sos-miam/commun/types/commentaires";

export type FilCommentaire = { commentaire: Commentaire; reponses: Commentaire[] };

/**
 * Range les commentaires d'une publication : la réponse du lieu en tête, puis les plus aimés, puis les plus récents ;
 * les réponses sous leur commentaire, de la plus ancienne à la plus récente. Retire les auteurs bloqués,
 * et ce qui a été masqué par le lieu (sauf pour son auteur).
 */
export function trierCommentaires(commentaires: Commentaire[], options: { bloques: string[]; moi: string }): FilCommentaire[] {
  const visibles = commentaires.filter((c) => !options.bloques.includes(c.auteur) && (!c.masqueParLieu || c.auteur === options.moi));
  const premiers = visibles.filter((c) => !c.reponseA || !visibles.some((p) => p.id === c.reponseA));
  const rang = (c: Commentaire) => (c.auteur === "lieu" ? 1 : 0);
  premiers.sort((a, b) => rang(b) - rang(a) || b.jaimes.length - a.jaimes.length || b.date.localeCompare(a.date));
  return premiers.map((commentaire) => ({
    commentaire,
    reponses: visibles.filter((c) => c.reponseA === commentaire.id).sort((a, b) => a.date.localeCompare(b.date)),
  }));
}
