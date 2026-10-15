import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.choix-offres-a-renvoyer";

export async function lireChoixOffresARenvoyer(): Promise<boolean | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu: unknown = brut ? JSON.parse(brut) : null;
    if (typeof lu !== "object" || lu === null) return null;
    const { offres } = lu as Record<string, unknown>;
    return typeof offres === "boolean" ? offres : null;
  } catch {
    return null;
  }
}

export const enregistrerChoixOffresARenvoyer = (offres: boolean) => AsyncStorage.setItem(CLE, JSON.stringify({ offres })).catch(() => {});
export const effacerChoixOffresARenvoyer = () => AsyncStorage.removeItem(CLE).catch(() => {});
