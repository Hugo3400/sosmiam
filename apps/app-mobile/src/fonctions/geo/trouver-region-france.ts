import { villesFrance } from "@sos-miam/commun/contenus/villes-france";
import type { PositionLieu } from "@sos-miam/commun/types/lieu";

import { calculerDistance } from "~/fonctions/geo/calculer-distance";
import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";

/** Au-delà, la ville connue la plus proche n'est plus un bon indice (tu es sûrement à l'étranger) */
const DISTANCE_MAX_KM = 150;

/**
 * La région de France où tu es : celle de la ville donnée si on la connaît, sinon celle de la ville connue la plus
 * proche de la position (à moins de 150 km). null si on ne peut pas le savoir.
 */
export function trouverRegionFrance(ville: string | null, position: PositionLieu | null): string | null {
  const connue = ville ? trouverVilleFrance(ville) : null;
  if (connue) return connue.region;
  if (!position) return null;
  let meilleure: { region: string; km: number } | null = null;
  for (const v of villesFrance) {
    const km = calculerDistance(position, v);
    if (!meilleure || km < meilleure.km) meilleure = { region: v.region, km };
  }
  return meilleure && meilleure.km <= DISTANCE_MAX_KM ? meilleure.region : null;
}
