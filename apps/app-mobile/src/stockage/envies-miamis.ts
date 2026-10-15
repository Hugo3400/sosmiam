import AsyncStorage from "@react-native-async-storage/async-storage";

import { lireEtiquetteLibre } from "@sos-miam/commun/validation/lire-etiquette-libre";

const CLE = "sosmiam.envies-miamis";

export async function lireEnviesMiamis(): Promise<string[]> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lues: unknown = brut ? JSON.parse(brut) : [];
    if (!Array.isArray(lues)) return [];
    return lues.flatMap((nom) => {
      if (typeof nom !== "string") return [];
      const lue = lireEtiquetteLibre(nom);
      return lue.ok && lue.officielle ? [lue.nom] : [];
    });
  } catch {
    return [];
  }
}

export async function enregistrerEnviesMiamis(envies: string[]): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(envies));
}

export async function effacerEnviesMiamis(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
