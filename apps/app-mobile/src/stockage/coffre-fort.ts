import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const MARQUE_INSTALLATION = "sosmiam.installation";
const COFFRE_FORT_DE_CET_APPAREIL = "appareil-seul";
const SECRETS_DU_COMPTE = ["sosmiam.session", "sosmiam.compte-de-cote", "sosmiam.code-invitation"];
const PROFIL_DU_COMPTE = "sosmiam.profil";

export const OPTIONS_COFFRE_FORT: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

let preparation: Promise<boolean> | null = null;

async function oublierInstallationPrecedente(): Promise<boolean> {
  const marque = await AsyncStorage.getItem(MARQUE_INSTALLATION);
  if (marque === COFFRE_FORT_DE_CET_APPAREIL) return true;
  const installationNeuve = marque === null;
  const aOublier = installationNeuve ? [...SECRETS_DU_COMPTE, PROFIL_DU_COMPTE] : SECRETS_DU_COMPTE;
  for (const cle of aOublier) await SecureStore.deleteItemAsync(cle);
  await AsyncStorage.setItem(MARQUE_INSTALLATION, COFFRE_FORT_DE_CET_APPAREIL);
  return true;
}

export function preparerCoffreFort(): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(true);
  preparation ??= oublierInstallationPrecedente().catch(() => false);
  return preparation;
}
