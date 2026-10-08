import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Le petit « toc » d'un J'aime par double appui : un peu plus franc que la vibration des boutons (rien sur le web). */
export function vibrerJaime(): void {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
