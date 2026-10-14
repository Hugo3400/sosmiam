import type { Commentaire, CommentaireApi } from "../../types/commentaires.ts";

/** Un commentaire de premier niveau et ses réponses, de la plus ancienne à la plus récente */
export type FilCommentaire<T extends Commentaire | CommentaireApi = Commentaire> = { commentaire: T; reponses: T[] };

/** Un commentaire de la démo : son auteur est un identifiant, pas une forme de l'API */
const estDeLaDemo = (c: Commentaire | CommentaireApi): c is Commentaire => typeof c.auteur === "string";

/** « lieu » pour la réponse du lieu ; sinon l'identifiant de la personne (« moi » dans la démo) */
function lireAuteur(c: Commentaire | CommentaireApi): string {
  if (estDeLaDemo(c)) return c.auteur;
  return c.auteur.type === "lieu" ? "lieu" : c.auteur.personne.id;
}

const compterJaimes = (c: Commentaire | CommentaireApi) => (estDeLaDemo(c) ? c.jaimes.length : c.jaimes);
const lireReponseA = (c: Commentaire | CommentaireApi) => c.reponseA ?? null;
const estMasqueParLieu = (c: Commentaire | CommentaireApi) => (estDeLaDemo(c) ? c.masqueParLieu === true : c.etat === "masque-par-le-lieu");

/**
 * Range les commentaires d'une publication, ceux de la démo (Commentaire) comme ceux de l'API (CommentaireApi) : la réponse
 * du lieu en tête, puis les plus aimés, puis les plus récents ; les réponses sous leur commentaire, de la plus ancienne à
 * la plus récente. Retire les auteurs bloqués, et ce qui a été masqué par le lieu (sauf pour son auteur, moi).
 * Un seul niveau de réponses à l'écran : une réponse à une réponse (possible quand un commentaire était caché par un
 * blocage, puis réapparaît) se range sous le premier commentaire visible de son fil, au lieu de disparaître ; une réponse
 * dont le commentaire n'est plus là passe au premier niveau.
 */
export function trierCommentaires<T extends Commentaire | CommentaireApi>(
  commentaires: readonly T[],
  options: { bloques: readonly string[]; moi: string },
): FilCommentaire<T>[] {
  const visibles = commentaires.filter((c) => {
    const auteur = lireAuteur(c);
    return !options.bloques.includes(auteur) && (!estMasqueParLieu(c) || auteur === options.moi);
  });
  const parId = new Map(visibles.map((c) => [c.id, c]));
  // Le haut du fil : on remonte les réponses tant que le parent est visible (les « vus » protègent d'une boucle)
  const remonter = (c: T) => {
    const vus = new Set<string>();
    let courant = c;
    let parentId = lireReponseA(courant);
    while (parentId !== null && !vus.has(courant.id)) {
      const parent = parId.get(parentId);
      if (!parent) break;
      vus.add(courant.id);
      courant = parent;
      parentId = lireReponseA(courant);
    }
    return courant;
  };
  const hautDuFil = new Map(visibles.map((c) => [c.id, remonter(c)]));
  const premiers = visibles.filter((c) => hautDuFil.get(c.id) === c);
  const rang = (c: T) => (lireAuteur(c) === "lieu" ? 1 : 0);
  premiers.sort((a, b) => rang(b) - rang(a) || compterJaimes(b) - compterJaimes(a) || b.date.localeCompare(a.date));
  return premiers.map((commentaire) => ({
    commentaire,
    reponses: visibles.filter((c) => c !== commentaire && hautDuFil.get(c.id) === commentaire).sort((a, b) => a.date.localeCompare(b.date)),
  }));
}
