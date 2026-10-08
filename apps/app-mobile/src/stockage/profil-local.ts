// Profil gardé sur le téléphone, dans son coffre-fort chiffré (Trousseau iOS, Keystore Android), en attendant l'API.
// Sur le web (aperçu de développement seulement), pas de coffre-fort : on passe par AsyncStorage.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { Profil } from "@sos-miam/commun/types/profil";

const CLE = "sosmiam.profil";
const surLeWeb = Platform.OS === "web";

/** Lit le profil gardé sur le téléphone ; null si la personne n'est pas encore inscrite (ou si la donnée est illisible). */
export async function lireProfilLocal(): Promise<Profil | null> {
  try {
    const brut = surLeWeb ? await AsyncStorage.getItem(CLE) : await SecureStore.getItemAsync(CLE);
    return brut ? (JSON.parse(brut) as Profil) : null;
  } catch {
    return null;
  }
}

/** Enregistre le profil sur le téléphone. */
export async function enregistrerProfilLocal(profil: Profil): Promise<void> {
  const brut = JSON.stringify(profil);
  if (surLeWeb) await AsyncStorage.setItem(CLE, brut);
  else await SecureStore.setItemAsync(CLE, brut);
}

/** Efface le profil du téléphone (désinscription, ou pour refaire l'inscription). */
export async function effacerProfilLocal(): Promise<void> {
  if (surLeWeb) await AsyncStorage.removeItem(CLE);
  else await SecureStore.deleteItemAsync(CLE);
}
