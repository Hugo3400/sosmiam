// Préférences du fil « Pour toi », gardées sur le téléphone : pour l'instant, le son des vidéos (coupé par défaut).
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PreferencesFil = {
  /** Son des vidéos coupé : vrai tant qu'on n'a pas demandé le son */
  sonCoupe: boolean;
};

export const PREFERENCES_FIL_PAR_DEFAUT: PreferencesFil = { sonCoupe: true };

const CLE = "sosmiam.preferences-fil";

/** Lit les préférences du fil (celles par défaut si rien, ou illisible). */
export async function lirePreferencesFil(): Promise<PreferencesFil> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu = brut ? (JSON.parse(brut) as Partial<PreferencesFil> | null) : null;
    if (!lu || typeof lu !== "object") return PREFERENCES_FIL_PAR_DEFAUT;
    return { sonCoupe: typeof lu.sonCoupe === "boolean" ? lu.sonCoupe : PREFERENCES_FIL_PAR_DEFAUT.sonCoupe };
  } catch {
    return PREFERENCES_FIL_PAR_DEFAUT;
  }
}

/** Enregistre les préférences du fil sur le téléphone. */
export async function enregistrerPreferencesFil(preferences: PreferencesFil): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(preferences));
}
