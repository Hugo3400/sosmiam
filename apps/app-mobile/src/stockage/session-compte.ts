// Le jeton de session du compte (session « app » d'un an, docs/decisions.md « L'app parle au serveur »), gardé dans le
// coffre-fort chiffré du téléphone (Trousseau iOS, Keystore Android), jamais dans les fichiers de l'app.
// Sur le web (aperçu de développement seulement), pas de coffre-fort : on passe par AsyncStorage.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CLE = "sosmiam.session";
const surLeWeb = Platform.OS === "web";
/** Forme d'un jeton de l'API (FORME_JETON de l'API) : un jeton abîmé est oublié */
const FORME_JETON = /^[A-Za-z0-9_-]{32,128}$/;

/** Le jeton gardé, ou null (pas connecté, ou illisible). */
export async function lireJetonSession(): Promise<string | null> {
  try {
    const jeton = surLeWeb ? await AsyncStorage.getItem(CLE) : await SecureStore.getItemAsync(CLE);
    return jeton && FORME_JETON.test(jeton) ? jeton : null;
  } catch {
    return null;
  }
}

/** Garde le jeton reçu à la connexion (ou le nouveau, après un changement de mot de passe). */
export async function enregistrerJetonSession(jeton: string): Promise<void> {
  if (surLeWeb) await AsyncStorage.setItem(CLE, jeton);
  else await SecureStore.setItemAsync(CLE, jeton, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
}

/** Oublie le jeton (déconnexion, session expirée, compte supprimé). */
export async function effacerJetonSession(): Promise<void> {
  try {
    if (surLeWeb) await AsyncStorage.removeItem(CLE);
    else await SecureStore.deleteItemAsync(CLE);
  } catch {
    // Rien à effacer
  }
}
