import type { ErreurService } from "../../types/erreurs-service.ts";
import type { ResultatPosition } from "../../types/position.ts";

const ERREURS: Readonly<Record<ResultatPosition, ErreurService | null>> = {
  "dans-rayon": null,
  "hors-rayon": "hors-zone",
  imprecise: "position-imprecise",
  perimee: "position-perimee",
  simulee: "position-simulee",
};

/** L'erreur à renvoyer pour un résultat de position, ou null quand la personne est bien sur place. */
export function traduireResultatPosition(resultat: ResultatPosition): ErreurService | null {
  return ERREURS[resultat];
}
