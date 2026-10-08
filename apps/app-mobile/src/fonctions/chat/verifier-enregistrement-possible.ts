import { Platform } from "react-native";

type EnvironnementNavigateur = {
  navigator?: { mediaDevices?: { getUserMedia?: unknown } };
  MediaRecorder?: unknown;
};

/** Vrai si on peut enregistrer une note vocale ici : toujours sur le téléphone ; sur le web, seulement si le navigateur a le micro et MediaRecorder. */
export function verifierEnregistrementPossible(): boolean {
  if (Platform.OS !== "web") return true;
  const env = globalThis as EnvironnementNavigateur;
  return typeof env.navigator?.mediaDevices?.getUserMedia === "function" && typeof env.MediaRecorder === "function";
}
