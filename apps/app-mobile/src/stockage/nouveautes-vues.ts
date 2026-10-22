import AsyncStorage from "@react-native-async-storage/async-storage";

import { lirePartiesVersion } from "~/fonctions/version/lire-parties-version";

const CLE = "sosmiam.nouveautes-vues";

export async function lireNouveautesVues(): Promise<string | null> {
  const brut = await AsyncStorage.getItem(CLE);
  return brut !== null && lirePartiesVersion(brut) !== null ? brut : null;
}

export async function noterNouveautesVues(version: string): Promise<void> {
  await AsyncStorage.setItem(CLE, version);
}
