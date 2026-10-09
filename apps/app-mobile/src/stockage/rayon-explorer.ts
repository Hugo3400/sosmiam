// Le rayon d'« À quelques kilomètres » dans Explorer, réglé au curseur et gardé sur le téléphone. Rien d'autre n'est gardé
// (ni position, ni ville) : juste un nombre de kilomètres.
import AsyncStorage from "@react-native-async-storage/async-storage";

import { RAYON_PROCHE_KM } from "~/contenus/portee-explorer";

const CLE = "sosmiam.explorer-rayon";

/** Le rayon gardé, en km (null si rien, illisible ou hors des bornes du curseur). */
export async function lireRayonExplorer(): Promise<number | null> {
  try {
    const km = Number(await AsyncStorage.getItem(CLE));
    return Number.isInteger(km) && km >= RAYON_PROCHE_KM.min && km <= RAYON_PROCHE_KM.max ? km : null;
  } catch {
    return null;
  }
}

/** Garde le rayon choisi. */
export async function enregistrerRayonExplorer(km: number): Promise<void> {
  await AsyncStorage.setItem(CLE, String(km));
}
