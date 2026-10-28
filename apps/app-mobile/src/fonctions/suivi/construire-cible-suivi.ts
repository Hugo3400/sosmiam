import type { Pote } from "@sos-miam/commun/types/potes";
import type { CompteSuivable } from "@sos-miam/commun/types/suivis";

/**
 * Ce que la règle peutSuivre sait d'une personne gardée sur le téléphone : un compte public (seul le serveur sait qui est
 * privé). Les créateurs restent des pages (« createur:<pseudo> »).
 */
export function construireCibleSuivi(pote: Pote): CompteSuivable {
  return { id: pote.id, prive: false };
}
