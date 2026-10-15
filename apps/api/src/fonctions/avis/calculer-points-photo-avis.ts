import { POINTS_AVIS_PHOTO } from "../../services/avis-regles.ts";

/**
 * Les points de la photo d'un avis (raison « avis-photo ») : 10 pour un avis vérifié (écrit grâce à une visite) avec une
 * photo, sauf repas offert (ils suivent ceux de la visite) ; 0 sinon, et toujours 0 pour un avis non vérifié. La même règle
 * pose les points à l'écriture, les retire quand l'équipe masque l'avis et les rend quand il revient en ligne.
 */
export function calculerPointsPhotoAvis(a: { visiteId: number | null; photo: string | null; repasOffert: boolean }): number {
  return a.visiteId !== null && a.photo !== null && !a.repasOffert ? POINTS_AVIS_PHOTO : 0;
}
