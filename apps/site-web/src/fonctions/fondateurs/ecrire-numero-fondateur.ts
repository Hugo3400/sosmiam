import type { CandidatureFondateur } from "~/types/compte";

/**
 * Le titre d'une carte de fondateur : « Fondateur n° 3 de Lyon · n° 147 en France » (« Fondatrice » au choix). Sans zone
 * (candidature d'avant les fondateurs par ville) ou sans numéro, ce qui manque est laissé de côté. Espaces insécables.
 */
export function ecrireNumeroFondateur(candidature: Pick<CandidatureFondateur, "numeroLocal" | "numeroNational" | "zone">, titre = "Fondateur"): string {
  const { numeroLocal, numeroNational, zone } = candidature;
  const local = numeroLocal ? ` n° ${numeroLocal}` : "";
  const lieu = zone ? ` ${zone.nomAvecDe.replace(/ /g, " ")}` : "";
  const national = numeroNational ? ` · n° ${numeroNational} en France` : "";
  return `${titre}${local}${lieu}${national}`;
}
