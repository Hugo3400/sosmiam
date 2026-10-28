import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ZonePortee } from "~/contenus/portee-explorer";
import { TEXTES_LOCALISATION_PAR_LANGUE } from "~/contenus/textes-localisation";
import { direDansRegion } from "~/fonctions/geo/dire-dans-region";

export function decrireZoneRegardee(zone: ZonePortee | null, region: string | null, autourDe: string, langue: Langue): string | null {
  if (!zone) return null;
  const T = choisirTextes(TEXTES_LOCALISATION_PAR_LANGUE, langue);
  if (zone.portee === "proche") return T.zoneProche(zone.rayonKm, autourDe);
  if (zone.portee === "region" && region) return direDansRegion(region, langue);
  return T.zoneFrance;
}
