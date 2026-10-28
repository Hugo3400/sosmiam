import { Alert, Linking, Platform } from "react-native";

import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_LOCALISATION_PAR_LANGUE } from "~/contenus/textes-localisation";
import type { ErreurPosition } from "~/fonctions/geo/lire-position-telephone";

export function alerterErreurPosition(erreur: ErreurPosition, message: string, langue: Langue): boolean {
  if (Platform.OS === "web") return false;
  const T = choisirTextes(TEXTES_LOCALISATION_PAR_LANGUE, langue).alerte;
  if (erreur === "refus-definitif") {
    Alert.alert(T.titre, message, [
      { text: T.plusTard, style: "cancel" },
      { text: T.ouvrirReglages, onPress: () => Linking.openSettings().catch(() => {}) },
    ]);
    return true;
  }
  if (erreur === "coupee") {
    Alert.alert(T.titre, message, [{ text: T.compris }]);
    return true;
  }
  return false;
}
