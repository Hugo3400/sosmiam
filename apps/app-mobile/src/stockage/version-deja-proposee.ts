import AsyncStorage from "@react-native-async-storage/async-storage";

import { lirePartiesVersion } from "~/fonctions/version/lire-parties-version";

const CLE = "sosmiam.version-app-deja-proposee";

let enMemoire: string | null | undefined;

export async function lireVersionDejaProposee(): Promise<string | null> {
  if (enMemoire !== undefined) return enMemoire;
  const brut = await AsyncStorage.getItem(CLE);
  if (enMemoire === undefined) enMemoire = brut !== null && lirePartiesVersion(brut) !== null ? brut : null;
  return enMemoire;
}

export async function noterVersionDejaProposee(version: string): Promise<void> {
  enMemoire = version;
  await AsyncStorage.setItem(CLE, version);
}
