// Avatar de la personne : un emoji, ou une photo gardée dans les fichiers de l'app.
// La photo ne quitte pas le téléphone (pas encore d'API). Sur le web (aperçu de développement), on garde l'adresse donnée par le navigateur.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

export type Avatar = { type: "emoji"; emoji: string } | { type: "photo"; uri: string };

export const AVATAR_PAR_DEFAUT: Avatar = { type: "emoji", emoji: "🦸" };

const CLE = "sosmiam.avatar";
const surLeWeb = Platform.OS === "web";

/** Lit l'avatar gardé sur le téléphone (l'avatar par défaut si rien, ou illisible). */
export async function lireAvatarLocal(): Promise<Avatar> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu: unknown = brut ? JSON.parse(brut) : null;
    if (typeof lu !== "object" || lu === null) return AVATAR_PAR_DEFAUT;
    const a = lu as Record<string, unknown>;
    if (a.type === "emoji" && typeof a.emoji === "string" && a.emoji !== "") return { type: "emoji", emoji: a.emoji };
    if (a.type === "photo" && typeof a.uri === "string" && a.uri !== "") return { type: "photo", uri: a.uri };
    return AVATAR_PAR_DEFAUT;
  } catch {
    return AVATAR_PAR_DEFAUT;
  }
}

/** Enregistre l'avatar sur le téléphone. */
export async function enregistrerAvatarLocal(avatar: Avatar): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(avatar));
}

/** Copie la photo choisie (fichier temporaire du sélecteur) dans les fichiers de l'app et renvoie sa nouvelle adresse. */
export async function garderPhotoAvatar(uriTemporaire: string): Promise<string> {
  if (surLeWeb) return uriTemporaire;
  const destination = new File(Paths.document, `avatar-${Date.now()}.jpg`);
  await new File(uriTemporaire).copy(destination);
  return destination.uri;
}

/** Supprime une photo d'avatar gardée dans les fichiers de l'app (remplacée, ou tout effacer). */
export function supprimerPhotoAvatar(uri: string): void {
  if (surLeWeb) return;
  try {
    const fichier = new File(uri);
    if (fichier.exists) fichier.delete();
  } catch {
    // Déjà partie : rien à faire
  }
}

/** Efface l'avatar du téléphone, photo comprise. */
export async function effacerAvatarLocal(): Promise<void> {
  const avatar = await lireAvatarLocal();
  if (avatar.type === "photo") supprimerPhotoAvatar(avatar.uri);
  await AsyncStorage.removeItem(CLE);
}
