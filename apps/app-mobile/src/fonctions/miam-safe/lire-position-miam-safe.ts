import * as Location from "expo-location";

import type { PositionMiamSafe } from "@sos-miam/commun/types/miam-safe";

/** On n'attend pas plus longtemps une position précise : sans elle, le pote est prévenu quand même */
const ATTENTE_MAX_MS = 8000;

/**
 * La position du téléphone pour « Prévenir un pote », seulement quand la personne l'a demandé : l'accès est demandé à ce
 * moment-là (« refusee » s'il est refusé), puis une position précise, ou à défaut la dernière connue (null : aucune).
 */
export async function lirePositionMiamSafe(): Promise<PositionMiamSafe | "refusee" | null> {
  const avant = await Location.getForegroundPermissionsAsync().catch(() => null);
  const acces = avant?.granted ? avant : await Location.requestForegroundPermissionsAsync().catch(() => null);
  if (!acces?.granted) return "refusee";
  const delai = new Promise<null>((fini) => setTimeout(() => fini(null), ATTENTE_MAX_MS));
  const lue =
    (await Promise.race([Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null), delai])) ??
    (await Location.getLastKnownPositionAsync().catch(() => null));
  if (!lue) return null;
  const precision = lue.coords.accuracy;
  return { latitude: lue.coords.latitude, longitude: lue.coords.longitude, precisionM: typeof precision === "number" ? Math.round(precision) : null };
}
