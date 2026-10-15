import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type LectureJetonTelephone =
  | { ok: true; jeton: string; plateforme: "ios" | "android" }
  | { ok: false; raison: "refusee" | "a-demander" | "indisponible" };

/**
 * Le jeton NATIF du téléphone pour les notifications (APNs sur iPhone, FCM sur Android ; jamais celui d'Expo : le serveur
 * envoie directement chez Apple et Google). Question pas encore posée : « a-demander ». Sur le web ou dans Expo Go (pas de
 * jeton natif), « indisponible ».
 */
export async function lireJetonTelephone(): Promise<LectureJetonTelephone> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return { ok: false, raison: "indisponible" };
  try {
    const acces = await Notifications.getPermissionsAsync();
    if (!acces.granted) return { ok: false, raison: acces.canAskAgain ? "a-demander" : "refusee" };
    const { data } = await Notifications.getDevicePushTokenAsync();
    return typeof data === "string" && data.length >= 20 ? { ok: true, jeton: data, plateforme: Platform.OS } : { ok: false, raison: "indisponible" };
  } catch {
    return { ok: false, raison: "indisponible" };
  }
}
