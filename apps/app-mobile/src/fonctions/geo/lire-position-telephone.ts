import * as Location from "expo-location";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";

export type ErreurPosition = "refus" | "refus-definitif" | "coupee" | "introuvable";

export type LecturePosition = { position: PositionLieu; approximative: boolean } | { erreur: ErreurPosition };

const AGE_MAX_POSITION = 2 * 60 * 1000;
const DELAI_MAX = 12_000;

function estApproximative(acces: Location.LocationPermissionResponse): boolean {
  return acces.ios?.accuracy === "reduced" || acces.android?.accuracy === "coarse";
}

export async function lirePositionTelephone(fraiche: boolean): Promise<LecturePosition> {
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  try {
    if (!(await Location.hasServicesEnabledAsync())) return { erreur: "coupee" };
    const avant = await Location.getForegroundPermissionsAsync();
    if (!avant.granted && !avant.canAskAgain) return { erreur: "refus-definitif" };
    const acces = await Location.requestForegroundPermissionsAsync();
    if (!acces.granted) return { erreur: "refus" };
    const lue =
      (fraiche ? null : await Location.getLastKnownPositionAsync({ maxAge: AGE_MAX_POSITION })) ??
      (await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resoudre) => {
          minuterie = setTimeout(() => resoudre(null), DELAI_MAX);
        }),
      ]));
    if (!lue) return { erreur: "introuvable" };
    return { position: { latitude: lue.coords.latitude, longitude: lue.coords.longitude }, approximative: estApproximative(acces) };
  } catch {
    return { erreur: "introuvable" };
  } finally {
    if (minuterie) clearTimeout(minuterie);
  }
}
