import type { LecturePosition } from "../types/position.ts";

const PRECISION_LUE_MAX_M = 100_000;
const AGE_LU_MAX_MS = 600_000;

const estNombreEntre = (valeur: unknown, min: number, max: number): valeur is number =>
  typeof valeur === "number" && Number.isFinite(valeur) && valeur >= min && valeur <= max;

/**
 * La lecture de position reçue (corps d'une demande) a-t-elle la bonne forme ? Latitude de −90 à 90, longitude de −180
 * à 180, précision nulle ou de 0 à 100 000 m, âge de 0 à 600 000 ms, et `simulee` booléen obligatoire.
 * Bornes larges : c'est `evaluerPosition` qui dit ensuite si la lecture est assez précise et récente pour valider.
 */
export function estLecturePositionValide(d: unknown): d is LecturePosition {
  if (typeof d !== "object" || d === null) return false;
  const lecture = d as Record<string, unknown>;
  return (
    estNombreEntre(lecture.latitude, -90, 90) &&
    estNombreEntre(lecture.longitude, -180, 180) &&
    (lecture.precision === null || estNombreEntre(lecture.precision, 0, PRECISION_LUE_MAX_M)) &&
    estNombreEntre(lecture.ageMs, 0, AGE_LU_MAX_MS) &&
    typeof lecture.simulee === "boolean"
  );
}
