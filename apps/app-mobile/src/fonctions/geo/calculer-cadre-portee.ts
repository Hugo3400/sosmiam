import { FRANCE_METROPOLITAINE, regionsFrance, type ZoneGeo } from "@sos-miam/commun/contenus/regions-france";

import type { ZonePortee } from "~/contenus/portee-explorer";

/** Un degré de latitude fait environ 111 km partout */
const KM_PAR_DEGRE = 111.2;

/**
 * Le rectangle que la carte d'Explorer cadre pour une zone, avec une clé qui ne change que si la zone change vraiment :
 * un carré de « rayon » km autour du centre, la région, ou la France métropolitaine. null si on ne sait pas quoi cadrer
 * (ni centre, ni région) : la carte garde alors son cadrage habituel (ta ville, sinon nos lieux).
 */
export function calculerCadrePortee(zone: ZonePortee): (ZoneGeo & { cle: string }) | null {
  if (zone.portee === "france") return { ...FRANCE_METROPOLITAINE, cle: "france" };
  if (zone.portee === "region") {
    const cadre = zone.region ? regionsFrance[zone.region] : undefined;
    return cadre ? { ...cadre, cle: `region:${zone.region}` } : null;
  }
  if (!zone.centre) return null;
  const { latitude, longitude } = zone.centre;
  const demiLatitude = zone.rayonKm / KM_PAR_DEGRE;
  // Un degré de longitude rétrécit loin de l'équateur : on corrige pour garder un carré
  const demiLongitude = demiLatitude / Math.cos((latitude * Math.PI) / 180);
  return {
    nord: latitude + demiLatitude,
    sud: latitude - demiLatitude,
    ouest: longitude - demiLongitude,
    est: longitude + demiLongitude,
    cle: `proche:${latitude.toFixed(4)},${longitude.toFixed(4)}:${zone.rayonKm}`,
  };
}
