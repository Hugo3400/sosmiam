import type { OffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import type { OffreEnBase } from "../../services/carriere-regles.ts";

export function presenterOffreCarriere(offre: OffreEnBase & { publieeLe: Date }): OffreCarriere {
  return {
    id: String(offre.id),
    titre: offre.titre,
    type: offre.type,
    domaine: offre.domaine,
    resume: offre.resume,
    description: offre.description,
    missions: [...offre.missions],
    profil: [...offre.profil],
    enEchange: [...offre.enEchange],
    lieu: offre.lieu,
    publieeLe: offre.publieeLe.toISOString(),
  };
}
