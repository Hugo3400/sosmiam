import { POINTS_AMBASSADEUR } from "../../regles/ambassadeurs.ts";

export function calculerPointsPhotoAvis(a: { verifie: boolean; avecPhoto: boolean; repasOffert: boolean }): number {
  return a.verifie && a.avecPhoto && !a.repasOffert ? POINTS_AMBASSADEUR.avisPhoto : 0;
}
