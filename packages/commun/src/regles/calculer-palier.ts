import type { ProgressionAmbassadeur } from "../types/ambassadeur";
import { PALIERS_AMBASSADEUR } from "./ambassadeurs";

/**
 * Calcule le palier atteint avec ces points, le suivant et ce qu'il manque pour y arriver.
 * Les paliers sur candidature (seuil null) ne s'atteignent jamais aux points.
 */
export function calculerPalier(points: number): ProgressionAmbassadeur {
  const total = Math.max(0, Math.floor(points));
  let index = 0;
  PALIERS_AMBASSADEUR.forEach((palier, i) => {
    if (palier.seuil !== null && total >= palier.seuil) index = i;
  });
  const actuel = PALIERS_AMBASSADEUR[index];
  const suivant = PALIERS_AMBASSADEUR[index + 1] ?? null;
  if (!suivant || suivant.seuil === null) return { actuel, index, suivant, reste: null, avancee: 1 };
  const depart = actuel.seuil ?? 0;
  return { actuel, index, suivant, reste: suivant.seuil - total, avancee: (total - depart) / (suivant.seuil - depart) };
}
