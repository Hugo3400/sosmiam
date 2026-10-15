import { POINTS_AVIS_PHOTO } from "../../services/avis-regles.ts";

/**
 * Les points de la photo d'un avis (raison « avis-photo ») : 10 pour un avis vérifié (écrit grâce à une visite) avec une
 * photo, sauf repas offert (ils suivent ceux de la visite) ; 0 sinon, et toujours 0 pour un avis non vérifié. Cette règle
 * pose les points à l'écriture et plafonne leur retrait quand l'équipe masque l'avis (avec le total du compte et ce que
 * l'avis tient encore d'après le journal) ; le retour en ligne, lui, rend ce que le journal dit retiré (avis-gestion.ts).
 */
export function calculerPointsPhotoAvis(a: { visiteId: number | null; photo: string | null; repasOffert: boolean }): number {
  return a.visiteId !== null && a.photo !== null && !a.repasOffert ? POINTS_AVIS_PHOTO : 0;
}
