import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function demanderAutorisationNotifications(): Promise<void> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;
  const acces = await Notifications.getPermissionsAsync().catch(() => null);
  if (acces && !acces.granted && acces.canAskAgain) await Notifications.requestPermissionsAsync().catch(() => null);
}
