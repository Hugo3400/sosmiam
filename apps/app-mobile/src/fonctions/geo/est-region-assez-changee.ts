import type { RegionCarte } from "~/contenus/regroupement-carte";

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
  return (
    Math.abs(apres.latitude - avant.latitude) > avant.latitudeDelta * PART_GLISSEMENT ||
    Math.abs(apres.longitude - avant.longitude) > avant.longitudeDelta * PART_GLISSEMENT
  );
}
