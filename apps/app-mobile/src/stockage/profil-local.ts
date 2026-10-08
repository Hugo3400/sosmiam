// Profil gardé sur le téléphone, dans son coffre-fort chiffré (Trousseau iOS, Keystore Android), en attendant l'API.
// Sur le web (aperçu de développement seulement), pas de coffre-fort : on passe par AsyncStorage.
// Le Trousseau iOS survit à une désinstallation, pas AsyncStorage : une marque d'installation dans AsyncStorage dit si le
// profil du coffre-fort appartient bien à cette installation (sinon, il est effacé et l'inscription recommence proprement).
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { Profil } from "@sos-miam/commun/types/profil";
import { estProfilValide } from "@sos-miam/commun/validation/est-profil-valide";

const CLE = "sosmiam.profil";
const MARQUE = "sosmiam.installation";
const surLeWeb = Platform.OS === "web";

/**
 * Vrai si le coffre-fort peut servir : la marque d'installation est là. Sinon, c'est la première ouverture depuis
 * l'installation : on pose la marque. Si d'autres données SOS Miam sont déjà là (téléphone d'avant la marque),
 * le profil est gardé ; sinon, il vient d'une installation précédente et il est oublié.
 */
async function verifierInstallation(): Promise<boolean> {
  if (await AsyncStorage.getItem(MARQUE)) return true;
  const cles = await AsyncStorage.getAllKeys();
  const dejaInstallee = cles.some((cle) => cle.startsWith("sosmiam.") && cle !== MARQUE);
  await AsyncStorage.setItem(MARQUE, "1");
  return dejaInstallee;
}

/** Lit le profil gardé sur le téléphone ; null si la personne n'est pas encore inscrite, ou si la donnée est illisible ou incomplète. */
export async function lireProfilLocal(): Promise<Profil | null> {
  try {
    if (!surLeWeb && !(await verifierInstallation())) {
      // Seulement le profil : le reste du coffre-fort (verrou d'âge compris) n'est jamais touché ici
      await SecureStore.deleteItemAsync(CLE);
      return null;
    }
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
  // La marque d'abord : un profil enregistré appartient toujours à cette installation
  await AsyncStorage.setItem(MARQUE, "1");
  await SecureStore.setItemAsync(CLE, brut);
}

/** Efface le profil du téléphone (désinscription, ou pour refaire l'inscription). */
export async function effacerProfilLocal(): Promise<void> {
  if (surLeWeb) await AsyncStorage.removeItem(CLE);
  else await SecureStore.deleteItemAsync(CLE);
}
