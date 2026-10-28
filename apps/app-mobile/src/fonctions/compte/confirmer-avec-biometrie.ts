import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CONNECTER_APPAREIL_PAR_LANGUE } from "~/contenus/textes-connecter-appareil";

/**
 * Face ID, l'empreinte ou, à défaut, le code du téléphone, avant une action sensible (connecter un appareil au compte).
 * « sans-verrou » : le téléphone n'a aucun verrouillage (ou c'est l'aperçu web), l'écran de confirmation suffit alors ;
 * « annule » : refusé, fermé, ou une panne (dans le doute, on ne connecte rien).
 */
export async function confirmerAvecBiometrie(raison: string, langue: Langue): Promise<"ok" | "annule" | "sans-verrou"> {
  if (Platform.OS === "web") return "sans-verrou";
  try {
    const niveau = await LocalAuthentication.getEnrolledLevelAsync();
    if (niveau === LocalAuthentication.SecurityLevel.NONE) return "sans-verrou";
    const reponse = await LocalAuthentication.authenticateAsync({ promptMessage: raison, cancelLabel: choisirTextes(TEXTES_CONNECTER_APPAREIL_PAR_LANGUE, langue).annulerBiometrie, disableDeviceFallback: false });
    return reponse.success ? "ok" : "annule";
  } catch {
    return "annule";
  }
}
