import * as SecureStore from "expo-secure-store";
import { DevSettings, Platform } from "react-native";

import { CLE_MODE_DEMO, DEMO_POSSIBLE } from "~/services/demo/demo-visites-active";

/**
 * Allume ou éteint le mode démo, puis relance l'app (le drapeau n'est lu qu'au lancement). L'appelant a déjà effacé les
 * données du mode qu'on quitte (utiliserEffacementLocal), pour qu'aucun exemple ne se mélange aux vraies données.
 */
export function basculerModeDemo(actif: boolean): void {
  if (!DEMO_POSSIBLE) return;
  if (Platform.OS === "web") {
    if (actif) globalThis.localStorage?.setItem(CLE_MODE_DEMO, "1");
    else globalThis.localStorage?.removeItem(CLE_MODE_DEMO);
    globalThis.location?.reload();
    return;
  }
  if (actif) SecureStore.setItem(CLE_MODE_DEMO, "1");
  else void SecureStore.deleteItemAsync(CLE_MODE_DEMO);
  // En développement (le seul endroit où la démo existe), React Native sait se relancer tout seul
  DevSettings.reload();
}
