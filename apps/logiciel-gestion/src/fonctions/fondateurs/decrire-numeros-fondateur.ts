import type { Candidature } from "~/services/fondateurs.ts";

/**
 * Le titre de la carte de fondateur : « Fondateur n° 3 de Lyon · n° 147 en France » (decisions.md, « Fondateurs par
 * ville »). Null tant que la candidature n'a pas ses deux numéros.
 */
export function decrireNumerosFondateur({ numeroLocal, numeroNational, zone }: Pick<Candidature, "numeroLocal" | "numeroNational" | "zone">): string | null {
  if (numeroLocal === null || numeroNational === null) return null;
  return `Fondateur n° ${numeroLocal}${zone ? ` ${zone.nomAvecDe}` : ""} · n° ${numeroNational} en France`;
}
