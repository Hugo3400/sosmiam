import { File } from "expo-file-system";
import { Platform } from "react-native";

export async function lireFichierPhoto(uri: string): Promise<Blob> {
  if (Platform.OS !== "web") return new File(uri);
  const reponse = await fetch(uri);
  return reponse.blob();
}
