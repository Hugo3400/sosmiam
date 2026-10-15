import { Alert, Linking, Platform } from "react-native";

import type { ErreurPosition } from "~/fonctions/geo/lire-position-telephone";

export function alerterErreurPosition(erreur: ErreurPosition, message: string): boolean {
  if (Platform.OS === "web") return false;
  if (erreur === "refus-definitif") {
    Alert.alert("Autour de moi", message, [
      { text: "Plus tard", style: "cancel" },
      { text: "Ouvrir les réglages", onPress: () => Linking.openSettings().catch(() => {}) },
    ]);
    return true;
  }
  if (erreur === "coupee") {
    Alert.alert("Autour de moi", message, [{ text: "Compris" }]);
    return true;
  }
  return false;
}
