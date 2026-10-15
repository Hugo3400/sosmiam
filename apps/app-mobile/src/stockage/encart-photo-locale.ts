import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.encart-photo-locale";

export async function lireEncartPhotoLocaleVu(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLE)) === "1";
  } catch {
    return false;
  }
}

export async function enregistrerEncartPhotoLocaleVu(): Promise<void> {
  try {
    await AsyncStorage.setItem(CLE, "1");
  } catch {
    return;
  }
}
