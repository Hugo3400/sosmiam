import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { RAISONS_SIGNALEMENT_PAR_LANGUE, raisonsSignalement, type ChoixRaisonSignalement } from "~/contenus/raisons-signalement";

export function traduireRaisonSignalement(raison: ChoixRaisonSignalement, langue: Langue): Traduction<ChoixRaisonSignalement> {
  const index = raisonsSignalement.findIndex((r) => r.cle === raison.cle);
  return choisirTextes(RAISONS_SIGNALEMENT_PAR_LANGUE, langue)[index] ?? raison;
}
