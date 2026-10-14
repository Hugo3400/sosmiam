// Le seul endroit qui dit si le MODE DÉMO est allumé (décidé par Hugo le 14 octobre 2026 : plus aucune donnée de démo,
// sauf avec le bouton « Démo »). Il n'existe qu'en développement, ou avec EXPO_PUBLIC_DEMO_VISITES=1 (jamais dans une
// version publiée), et seulement si la personne l'a allumé : le drapeau est lu une fois, au lancement, dans le coffre-fort
// (AsyncStorage n'est pas lisible tout de suite) ; le changer relance l'app (basculerModeDemo).
// Lu par choisirServices (services de démo), FournisseurModes (rôles joués), la source des lieux et du fil, et les
// fournisseurs des potes, messages, abonnés et notifications : tous voient toujours la même valeur.
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const CLE_MODE_DEMO = "sosmiam.mode-demo";

/** Le bouton « Démo » existe dans cette version de l'app (développement, ou version de test compilée exprès) */
export const DEMO_POSSIBLE = __DEV__ || process.env.EXPO_PUBLIC_DEMO_VISITES === "1";

function lireDrapeau(): boolean {
  try {
    const valeur = Platform.OS === "web" ? globalThis.localStorage?.getItem(CLE_MODE_DEMO) : SecureStore.getItem(CLE_MODE_DEMO);
    return valeur === "1";
  } catch {
    return false;
  }
}

/** Vrai si le mode démo est allumé : lieux, fil, potes, visites et rôles d'exemple, faux serveur sur le téléphone */
export const DEMO_VISITES_ACTIVE = DEMO_POSSIBLE && lireDrapeau();
