import Constants from "expo-constants";
import { Platform } from "react-native";

export const VERSION_INSTALLEE: string | null = Constants.expoConfig?.version ?? null;

export const PLATEFORME_STORE: "ios" | "android" | null = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : null;
