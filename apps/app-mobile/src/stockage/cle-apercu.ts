import { AESEncryptionKey, AESKeySize } from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CLE = "cle-apercu";
const GROUPE_TROUSSEAU = "4F7UVS2357.fr.sosmiam.app.partage";
const FORME_CLE = /^[A-Za-z0-9+/]{43}=$/;

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: "sosmiam.apercu",
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  ...(Platform.OS === "ios" ? { accessGroup: GROUPE_TROUSSEAU } : {}),
};

export async function lireCleApercu(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const cle = await SecureStore.getItemAsync(CLE, OPTIONS);
    return cle && FORME_CLE.test(cle) ? cle : null;
  } catch {
    return null;
  }
}

export async function obtenirCleApercu(): Promise<string | null> {
  const deja = await lireCleApercu();
  if (deja || Platform.OS === "web") return deja;
  try {
    const cle = await (await AESEncryptionKey.generate(AESKeySize.AES256)).encoded("base64");
    if (!FORME_CLE.test(cle)) return null;
    await SecureStore.setItemAsync(CLE, cle, OPTIONS);
    return (await lireCleApercu()) === cle ? cle : null;
  } catch {
    return null;
  }
}

export async function oublierCleApercu(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await SecureStore.deleteItemAsync(CLE, OPTIONS);
  } catch {
    return;
  }
}
