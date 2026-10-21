import type { OffreCarriereGestion } from "../../../../../packages/commun/src/types/carriere.ts";
import type { CompteCandidatures, OffreEnBase } from "../../services/carriere-regles.ts";

export function presenterOffreGestion(offre: OffreEnBase, compte: CompteCandidatures | undefined): OffreCarriereGestion {
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
    publieeLe: offre.publieeLe?.toISOString() ?? null,
    fermeeLe: offre.fermeeLe?.toISOString() ?? null,
    creeLe: offre.creeLe.toISOString(),
    modifieLe: offre.modifieLe.toISOString(),
    candidatures: compte?.candidatures ?? 0,
    nouvelles: compte?.nouvelles ?? 0,
  };
}
