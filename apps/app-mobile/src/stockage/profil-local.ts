// Profil gardé sur le téléphone, dans son coffre-fort chiffré (Trousseau iOS, Keystore Android), en attendant l'API.
// Sur le web (aperçu de développement seulement), pas de coffre-fort : on passe par AsyncStorage.
// Le Trousseau iOS survit à une désinstallation, pas AsyncStorage : une marque d'installation dans AsyncStorage dit si le
// profil du coffre-fort appartient bien à cette installation (sinon, il est effacé et l'inscription recommence proprement).
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { Profil } from "@sos-miam/commun/types/profil";
import { estProfilValide } from "@sos-miam/commun/validation/est-profil-valide";
import { OPTIONS_COFFRE_FORT, preparerCoffreFort } from "~/stockage/coffre-fort";

const CLE = "sosmiam.profil";
const surLeWeb = Platform.OS === "web";

/** Lit le profil gardé sur le téléphone ; null si la personne n'est pas encore inscrite, ou si la donnée est illisible ou incomplète. */
export async function lireProfilLocal(): Promise<Profil | null> {
  try {
    if (!(await preparerCoffreFort())) return null;
    const brut = surLeWeb ? await AsyncStorage.getItem(CLE) : await SecureStore.getItemAsync(CLE);
    if (!brut) return null;
    const lu: unknown = JSON.parse(brut);
    return estProfilValide(lu) ? lu : null;
  } catch {
    return null;
  }
}

/** Enregistre le profil sur le téléphone. */
export async function enregistrerProfilLocal(profil: Profil): Promise<void> {
  const brut = JSON.stringify(profil);
  if (surLeWeb) return AsyncStorage.setItem(CLE, brut);
  await preparerCoffreFort();
  await SecureStore.setItemAsync(CLE, brut, OPTIONS_COFFRE_FORT);
}

/** Efface le profil du téléphone (désinscription, ou pour refaire l'inscription). */
export async function effacerProfilLocal(): Promise<void> {
  if (surLeWeb) await AsyncStorage.removeItem(CLE);
  else await SecureStore.deleteItemAsync(CLE);
}
