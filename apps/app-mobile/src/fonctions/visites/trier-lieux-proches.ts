import { calculerDistanceMetres } from "@sos-miam/commun/fonctions/geo/calculer-distance-metres";
import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";

/**
 * Les lieux à moins de `rayonM` mètres d'une position, du plus proche au plus loin, avec leur distance en mètres
 * (« Tu es chez qui ? »). Un lieu pas encore placé sur la carte n'est jamais « proche ».
 */
export function trierLieuxProches(lieux: readonly Lieu[], position: PositionLieu, rayonM: number): { lieu: Lieu; distanceM: number }[] {
  const proches: { lieu: Lieu; distanceM: number }[] = [];
  for (const lieu of lieux) {
    if (!lieu.position) continue;
    const distanceM = calculerDistanceMetres(position, lieu.position);
    if (distanceM <= rayonM) proches.push({ lieu, distanceM });
  }
  return proches.sort((a, b) => a.distanceM - b.distanceM || a.lieu.nom.localeCompare(b.lieu.nom, "fr"));
}
