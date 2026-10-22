import { PHOTOS_CHAT_DEMO } from "~/contenus/photos-chat-demo";

export function lireSourcePhotoChat(fichier: string): number | { uri: string } | null {
  if (fichier.startsWith("exemple:")) return PHOTOS_CHAT_DEMO[fichier] ?? null;
  return { uri: fichier };
}
