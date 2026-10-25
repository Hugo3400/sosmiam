import AsyncStorage from "@react-native-async-storage/async-storage";

import { REGLAGES_LANGUE, type ReglageLangue } from "~/contenus/type-langue";

const CLE = "sosmiam.langue";

export async function lireReglageLangue(): Promise<ReglageLangue> {
  try {
    const valeur = await AsyncStorage.getItem(CLE);
    return REGLAGES_LANGUE.includes(valeur as ReglageLangue) ? (valeur as ReglageLangue) : "automatique";
  } catch {
    return "automatique";
  }
}

export async function enregistrerReglageLangue(reglage: ReglageLangue): Promise<void> {
  await AsyncStorage.setItem(CLE, reglage).catch(() => undefined);
}
