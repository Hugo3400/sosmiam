import { METRES_PAR_DEGRE, METRES_PAR_POINT_RUE } from "~/contenus/regroupement-carte";

const PART_SURE = 0.7;
const COTE_MIN_POINTS = 60;

export function calculerDemiCoteRue(cotePoints: number): number {
  const cote = Number.isFinite(cotePoints) ? Math.max(cotePoints, COTE_MIN_POINTS) : COTE_MIN_POINTS;
  return (METRES_PAR_POINT_RUE * PART_SURE * cote) / 2 / METRES_PAR_DEGRE;
}
