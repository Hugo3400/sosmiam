import { MARGE_VUE_CARTE, type RegionCarte } from "~/contenus/regroupement-carte";

const PART_GLISSEMENT = 0.2;
const ECART_NIVEAU = 0.5;

function estRegionValide(region: RegionCarte | null): region is RegionCarte {
  return (
    !!region &&
    Number.isFinite(region.latitude) &&
    Number.isFinite(region.longitude) &&
    Number.isFinite(region.latitudeDelta) &&
    Number.isFinite(region.longitudeDelta) &&
    region.latitudeDelta > 0 &&
    region.longitudeDelta > 0
  );
}

export function estRegionAssezChangee(avant: RegionCarte | null, apres: RegionCarte): boolean {
  if (!estRegionValide(apres)) return false;
  if (!estRegionValide(avant)) return true;
  if (Math.abs(Math.log2(apres.longitudeDelta / avant.longitudeDelta)) >= ECART_NIVEAU) return true;
  const ecartLatitude = Math.abs(apres.latitude - avant.latitude);
  const ecartLongitude = Math.abs(apres.longitude - avant.longitude);
  if (ecartLatitude > avant.latitudeDelta * PART_GLISSEMENT || ecartLongitude > avant.longitudeDelta * PART_GLISSEMENT) return true;
  const part = 0.5 + MARGE_VUE_CARTE;
  return ecartLatitude + apres.latitudeDelta / 2 > avant.latitudeDelta * part || ecartLongitude + apres.longitudeDelta / 2 > avant.longitudeDelta * part;
}
