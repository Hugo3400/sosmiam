import type { PositionLieu } from "../../types/lieu.ts";
import type { EvaluationPosition, LecturePosition } from "../../types/position.ts";
import { AGE_POSITION_MAX_MS, PRECISION_MAX_M, PRECISION_PLAFOND_M, RAYON_VALIDATION_M } from "../../regles/visites.ts";
import { calculerDistanceMetres } from "../geo/calculer-distance-metres.ts";

/**
 * Le téléphone est-il bien chez le lieu ? Contrôles, dans l'ordre : position simulée, lecture trop vieille (ou âge
 * invalide), imprécision trop grande (ou inconnue), puis distance, en retirant l'imprécision plafonnée à 150 m.
 * `distanceM` est toujours calculée : elle sert seulement au message « environ 1,2 km » et n'est jamais gardée.
 * Tout ce qui n'est pas explicitement `simulee: false` est traité comme simulé (refus par défaut).
 */
export function evaluerPosition(lecture: LecturePosition, lieu: PositionLieu, rayonM: number = RAYON_VALIDATION_M): EvaluationPosition {
  const distanceM = calculerDistanceMetres(lecture, lieu);
  if (lecture.simulee !== false) return { resultat: "simulee", distanceM };

  const { ageMs, precision } = lecture;
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > AGE_POSITION_MAX_MS) return { resultat: "perimee", distanceM };
  if (precision === null || !Number.isFinite(precision) || precision < 0 || precision > PRECISION_MAX_M) {
    return { resultat: "imprecise", distanceM };
  }

  const tolerance = Math.min(precision, PRECISION_PLAFOND_M);
  return { resultat: distanceM - tolerance <= rayonM ? "dans-rayon" : "hors-rayon", distanceM };
}
