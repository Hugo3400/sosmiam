import AsyncStorage from "@react-native-async-storage/async-storage";

export type ChoixTelephone = "oui" | "non" | "couper";

const CLE = "sosmiam.choix-offres-a-renvoyer";
const CHOIX: readonly unknown[] = ["oui", "non", "couper"] satisfies ChoixTelephone[];

export async function lireChoixOffresARenvoyer(): Promise<ChoixTelephone | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu: unknown = brut ? JSON.parse(brut) : null;
    if (typeof lu !== "object" || lu === null) return null;
    const { choix, offres } = lu as Record<string, unknown>;
    if (CHOIX.includes(choix)) return choix as ChoixTelephone;
    if (typeof offres === "boolean") return offres ? "oui" : "non";
    return null;
  } catch {
    return null;
  }
}

export const enregistrerChoixOffresARenvoyer = (choix: ChoixTelephone) => AsyncStorage.setItem(CLE, JSON.stringify({ choix })).catch(() => {});
export const effacerChoixOffresARenvoyer = () => AsyncStorage.removeItem(CLE).catch(() => {});
