// Le compte mis de côté pendant la démo (développement seulement) : entrer dans la démo ne déconnecte plus pour de bon. Le
// jeton de session reste valable sur le serveur et attend ici, dans le coffre-fort ; « Quitter la démo » le remet en place et
// l'app rouvre ce compte (marque de reprise, lue au lancement). Sur le web (aperçu de développement), AsyncStorage.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { OPTIONS_COFFRE_FORT, preparerCoffreFort } from "~/stockage/coffre-fort";

const CLE = "sosmiam.compte-de-cote";
const CLE_REPRISE = "sosmiam.reprise-compte";
const surLeWeb = Platform.OS === "web";
const FORME_JETON = /^[A-Za-z0-9_-]{32,128}$/;

export type CompteDeCote = { jeton: string; email: string };

export async function lireCompteDeCote(): Promise<CompteDeCote | null> {
  try {
    if (!(await preparerCoffreFort())) return null;
    const brut = surLeWeb ? await AsyncStorage.getItem(CLE) : await SecureStore.getItemAsync(CLE);
    const lu = brut ? (JSON.parse(brut) as Partial<CompteDeCote>) : null;
    return lu && typeof lu.jeton === "string" && FORME_JETON.test(lu.jeton) && typeof lu.email === "string" ? { jeton: lu.jeton, email: lu.email } : null;
  } catch {
    return null;
  }
}

export async function garderCompteDeCote(compte: CompteDeCote): Promise<void> {
  const brut = JSON.stringify(compte);
  if (surLeWeb) return AsyncStorage.setItem(CLE, brut);
  await preparerCoffreFort();
  await SecureStore.setItemAsync(CLE, brut, OPTIONS_COFFRE_FORT);
}

export async function effacerCompteDeCote(): Promise<void> {
  try {
    if (surLeWeb) await AsyncStorage.removeItem(CLE);
    else await SecureStore.deleteItemAsync(CLE);
  } catch {
    // Rien à effacer
  }
}

/** La marque « rouvre ce compte au prochain lancement » (posée en quittant la démo) */
export const poserRepriseCompte = () => AsyncStorage.setItem(CLE_REPRISE, "1").catch(() => {});
export const lireRepriseCompte = async () => (await AsyncStorage.getItem(CLE_REPRISE).catch(() => null)) === "1";
export const effacerRepriseCompte = () => AsyncStorage.removeItem(CLE_REPRISE).catch(() => {});
