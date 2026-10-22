import AsyncStorage from "@react-native-async-storage/async-storage";

import { REGLAGES_APPARENCE, type ReglageApparence } from "~/contenus/type-apparence";

const CLE = "sosmiam.apparence";

export async function lireReglageApparence(): Promise<ReglageApparence> {
  try {
    const valeur = await AsyncStorage.getItem(CLE);
    return REGLAGES_APPARENCE.includes(valeur as ReglageApparence) ? (valeur as ReglageApparence) : "automatique";
  } catch {
    return "automatique";
  }
}

export async function enregistrerReglageApparence(reglage: ReglageApparence): Promise<void> {
  await AsyncStorage.setItem(CLE, reglage).catch(() => undefined);
}
