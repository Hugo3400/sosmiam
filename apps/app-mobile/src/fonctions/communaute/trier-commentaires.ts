import type { Commentaire } from "@sos-miam/commun/types/commentaires";

export type FilCommentaire = { commentaire: Commentaire; reponses: Commentaire[] };

/**
 * Range les commentaires d'une publication : la réponse du lieu en tête, puis les plus aimés, puis les plus récents ;
 * les réponses sous leur commentaire, de la plus ancienne à la plus récente. Retire les auteurs bloqués,
 * et ce qui a été masqué par le lieu (sauf pour son auteur).
 * Un seul niveau de réponses à l'écran : une réponse à une réponse (possible quand un commentaire était caché par un
 * blocage, puis réapparaît) se range sous le premier commentaire visible de son fil, au lieu de disparaître.
 */
export function trierCommentaires(commentaires: Commentaire[], options: { bloques: string[]; moi: string }): FilCommentaire[] {
  const visibles = commentaires.filter((c) => !options.bloques.includes(c.auteur) && (!c.masqueParLieu || c.auteur === options.moi));
  const parId = new Map(visibles.map((c) => [c.id, c]));
  // Le haut du fil : on remonte les réponses tant que le parent est visible (les « vus » protègent d'une boucle)
  const remonter = (c: Commentaire) => {
    const vus = new Set<string>();
    let courant = c;
    while (courant.reponseA !== undefined && !vus.has(courant.id)) {
      const parent = parId.get(courant.reponseA);
      if (!parent) break;
      vus.add(courant.id);
      courant = parent;
    }
    return courant;
  };
  const hautDuFil = new Map(visibles.map((c) => [c.id, remonter(c)]));
  const premiers = visibles.filter((c) => hautDuFil.get(c.id) === c);
  const rang = (c: Commentaire) => (c.auteur === "lieu" ? 1 : 0);
  premiers.sort((a, b) => rang(b) - rang(a) || b.jaimes.length - a.jaimes.length || b.date.localeCompare(a.date));
  return premiers.map((commentaire) => ({
    commentaire,
    reponses: visibles.filter((c) => c !== commentaire && hautDuFil.get(c.id) === commentaire).sort((a, b) => a.date.localeCompare(b.date)),
  }));
}
