import type { ResumeAvis } from "../../types/avis.ts";
import { calculerMoyennePrudente } from "./calculer-moyenne-prudente.ts";
import { calculerPartRetour } from "./calculer-part-retour.ts";

/**
 * Le résumé des avis d'un lieu : la moyenne prudente des notes arrondie au dixième (null sans avis), le nombre d'avis, et
 * la part de clients qui reviennent arrondie au centième (null en dessous de 20 clients). `visites` : les visites validées
 * du lieu, une ligne par client et par jour suffit (voir calculerPartRetour).
 */
export function resumerAvis(notes: readonly number[], visites: readonly { client: string; jour: string }[]): ResumeAvis {
  const moyenne = calculerMoyennePrudente(notes);
  const partRetour = calculerPartRetour(visites);
  return {
    moyenne: moyenne === null ? null : Math.round(moyenne * 10) / 10,
    nombre: notes.length,
    partRetour: partRetour === null ? null : Math.round(partRetour * 100) / 100,
  };
}
