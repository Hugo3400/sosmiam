import type { LocationGeocodedAddress } from "expo-location";

/** Nom de la ville d'une adresse trouvée à partir d'une position (la commune, sinon le département), ou null. */
export function extraireNomVille(adresse: LocationGeocodedAddress): string | null {
  const nom = adresse.city ?? adresse.subregion ?? adresse.region;
  return nom && nom.trim() !== "" ? nom.trim() : null;
}
