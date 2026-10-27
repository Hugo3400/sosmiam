import AsyncStorage from "@react-native-async-storage/async-storage";

import type { BrouillonActusSaisi } from "~/contenus/type-brouillon-actus";
import { lireBrouillonActus } from "~/fonctions/actus/lire-brouillon-actus";

const CLE = "sosmiam.brouillon-actus";

export async function lireBrouillonActusGarde(): Promise<BrouillonActusSaisi | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    return lireBrouillonActus(brut ? JSON.parse(brut) : null);
  } catch {
    return null;
  }
}

export async function garderBrouillonActus(brouillon: BrouillonActusSaisi): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(brouillon)).catch(() => {});
}

export async function effacerBrouillonActus(): Promise<void> {
  await AsyncStorage.removeItem(CLE).catch(() => {});
}
