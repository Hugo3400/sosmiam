import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.themes-saison";

export async function lireThemesSaisonActifs(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLE)) !== "0";
  } catch {
    return true;
  }
}

export async function enregistrerThemesSaisonActifs(actifs: boolean): Promise<void> {
  await AsyncStorage.setItem(CLE, actifs ? "1" : "0").catch(() => undefined);
}
