import type { CommentaireIdee } from "@sos-miam/commun/types/idees";

export type FilCommentaireIdee = { commentaire: CommentaireIdee; reponses: CommentaireIdee[] };

function trouverRacine(commentaire: CommentaireIdee, parId: ReadonlyMap<string, CommentaireIdee>): CommentaireIdee {
  const vus = new Set<string>([commentaire.id]);
  let actuel = commentaire;
  while (actuel.reponseA !== null) {
    const parent = parId.get(actuel.reponseA);
    if (!parent || vus.has(parent.id)) break;
    vus.add(parent.id);
    actuel = parent;
  }
  return actuel;
}

export function rangerCommentairesIdee(commentaires: readonly CommentaireIdee[]): FilCommentaireIdee[] {
  const parId = new Map(commentaires.map((c) => [c.id, c]));
  const reponsesParRacine = new Map<string, CommentaireIdee[]>();
  const premiers: CommentaireIdee[] = [];
  for (const commentaire of commentaires) {
    const racine = trouverRacine(commentaire, parId);
    if (racine.id === commentaire.id) premiers.push(commentaire);
    else reponsesParRacine.set(racine.id, [...(reponsesParRacine.get(racine.id) ?? []), commentaire]);
  }
  return premiers
    .sort((a, b) => b.jaime - a.jaime || Date.parse(b.date) - Date.parse(a.date))
    .map((commentaire) => ({
      commentaire,
      reponses: (reponsesParRacine.get(commentaire.id) ?? []).sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
    }));
}
