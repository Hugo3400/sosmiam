import { DUREE_CONSERVATION_CANDIDATURE_MS } from "../../services/carriere-regles.ts";

export function calculerEffacementCandidature(creeLe: Date): Date {
  return new Date(creeLe.getTime() + DUREE_CONSERVATION_CANDIDATURE_MS);
}
