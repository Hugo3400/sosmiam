import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

/**
 * Face ID, l'empreinte ou, à défaut, le code du téléphone, avant une action sensible (connecter un appareil au compte).
 * « sans-verrou » : le téléphone n'a aucun verrouillage (ou c'est l'aperçu web), l'écran de confirmation suffit alors ;
 * « annule » : refusé, fermé, ou une panne (dans le doute, on ne connecte rien).
 */
export async function confirmerAvecBiometrie(raison: string): Promise<"ok" | "annule" | "sans-verrou"> {
  if (Platform.OS === "web") return "sans-verrou";
  try {
    const niveau = await LocalAuthentication.getEnrolledLevelAsync();
    if (niveau === LocalAuthentication.SecurityLevel.NONE) return "sans-verrou";
    const reponse = await LocalAuthentication.authenticateAsync({ promptMessage: raison, cancelLabel: "Annuler", disableDeviceFallback: false });
    return reponse.success ? "ok" : "annule";
  } catch {
    return "annule";
  }
}
