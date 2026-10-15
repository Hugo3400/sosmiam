import type { ZonePortee } from "~/contenus/portee-explorer";
import { direDansRegion } from "~/fonctions/geo/dire-dans-region";

export function decrireZoneRegardee(zone: ZonePortee | null, region: string | null, autourDe: string): string | null {
  if (!zone) return null;
  if (zone.portee === "proche") return `à moins de ${zone.rayonKm} km ${autourDe}`;
  if (zone.portee === "region" && region) return direDansRegion(region);
  return "dans toute la France";
}
