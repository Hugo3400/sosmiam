import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.astuce-double-toucher";

export async function lireAstuceDoubleToucherVue(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLE)) === "1";
  } catch {
    return true;
  }
}

export async function noterAstuceDoubleToucherVue(): Promise<void> {
  try {
    await AsyncStorage.setItem(CLE, "1");
  } catch {}
}
