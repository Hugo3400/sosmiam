import { DELAI_INVITATION_AVIS_MS } from "@sos-miam/commun/regles/visites";

import type { ReglagesDemo } from "./types-demo";

/** « Avis en accéléré » : l'avis s'ouvre 1 min après la visite au lieu d'1 h */
const DELAI_AVIS_ACCELERE_MS = 60_000;

/** Délai avant l'ouverture de l'avis d'une visite validée dans la démo (1 h, ou 1 min en accéléré). */
export function lireDelaiAvisDemo(reglages: ReglagesDemo): number {
  return reglages.avisAccelere ? DELAI_AVIS_ACCELERE_MS : DELAI_INVITATION_AVIS_MS;
}
