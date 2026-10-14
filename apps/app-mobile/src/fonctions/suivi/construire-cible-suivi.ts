import type { Pote } from "@sos-miam/commun/types/potes";
import type { CompteSuivable } from "@sos-miam/commun/types/suivis";

import { comptesPrivesExemples } from "~/contenus/suivis-exemples";

/**
 * Ce que la règle peutSuivre sait d'une personne de la démo : si elle a choisi d'être privée (comptesPrivesExemples).
 * Aucun créateur parmi les personnes en démo : les créateurs restent des pages (« createur:<pseudo> »).
 */
export function construireCibleSuivi(pote: Pote): CompteSuivable {
  return { id: pote.id, prive: comptesPrivesExemples.includes(pote.id) };
}
