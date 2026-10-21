import { File } from "expo-file-system";
import { Platform } from "react-native";

export function oublierFichierPhoto(uri: string): void {
  if (Platform.OS === "web") return;
  try {
    const fichier = new File(uri);
    if (fichier.exists) fichier.delete();
  } catch {
    return;
  }
}
