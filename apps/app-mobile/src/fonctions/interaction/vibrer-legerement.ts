import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Petite vibration de confirmation au toucher (rien sur le web, qui n'en a pas). */
export function vibrerLegerement(): void {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
