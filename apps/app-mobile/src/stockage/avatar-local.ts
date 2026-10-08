// Avatar de la personne : un emoji, ou une photo gardée dans les fichiers de l'app.
// La photo ne quitte pas le téléphone (pas encore d'API). Sur le web (aperçu de développement), on garde l'adresse donnée par le navigateur.
// Sur le téléphone, on ne garde que le nom du fichier : iOS peut changer le dossier de l'app (mise à jour), on refait l'adresse à chaque lecture.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { Image } from "expo-image";
import { Platform } from "react-native";

export type Avatar = { type: "emoji"; emoji: string } | { type: "photo"; uri: string };

export const AVATAR_PAR_DEFAUT: Extract<Avatar, { type: "emoji" }> = { type: "emoji", emoji: "🦸" };

const CLE = "sosmiam.avatar";
const surLeWeb = Platform.OS === "web";
// Nom des photos gardées dans les fichiers de l'app (voir garderPhotoAvatar)
const NOM_PHOTO = /^avatar-\d+\.jpg$/;

/** Le fichier de la photo dans les fichiers de l'app, à partir de son nom ou d'une ancienne adresse complète (null si ce n'est pas une photo d'avatar). */
function retrouverPhoto(nomOuAdresse: string): File | null {
  const nom = nomOuAdresse.split("/").pop() ?? "";
  return NOM_PHOTO.test(nom) ? new File(Paths.document, nom) : null;
}

/** Vide le dossier où le sélecteur de photos dépose ses fichiers temporaires (pas de copie oubliée dans le cache). */
function viderCacheSelecteur(): void {
  try {
    const cache = new Directory(Paths.cache, "ImagePicker");
    if (cache.exists) cache.delete();
  } catch {
    // Rien à vider, ou le système s'en est déjà chargé
  }
}

/** Lit l'avatar gardé sur le téléphone (l'avatar par défaut si rien, illisible, ou si la photo a disparu). */
export async function lireAvatarLocal(): Promise<Avatar> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu: unknown = brut ? JSON.parse(brut) : null;
    if (typeof lu !== "object" || lu === null) return AVATAR_PAR_DEFAUT;
    const a = lu as Record<string, unknown>;
    if (a.type === "emoji" && typeof a.emoji === "string" && a.emoji !== "") return { type: "emoji", emoji: a.emoji };
    if (a.type === "photo" && typeof a.uri === "string" && a.uri !== "") {
      if (surLeWeb) return { type: "photo", uri: a.uri };
      const photo = retrouverPhoto(a.uri);
      return photo?.exists ? { type: "photo", uri: photo.uri } : AVATAR_PAR_DEFAUT;
    }
    return AVATAR_PAR_DEFAUT;
  } catch {
    return AVATAR_PAR_DEFAUT;
  }
}

/** Enregistre l'avatar sur le téléphone (pour une photo : seulement le nom de son fichier). */
export async function enregistrerAvatarLocal(avatar: Avatar): Promise<void> {
  const aGarder = avatar.type === "photo" && !surLeWeb ? { type: "photo", uri: avatar.uri.split("/").pop() ?? "" } : avatar;
  await AsyncStorage.setItem(CLE, JSON.stringify(aGarder));
}

/** Range la photo choisie (fichier temporaire du sélecteur) dans les fichiers de l'app et renvoie sa nouvelle adresse. */
export async function garderPhotoAvatar(uriTemporaire: string): Promise<string> {
  if (surLeWeb) return uriTemporaire;
  const destination = new File(Paths.document, `avatar-${Date.now()}.jpg`);
  const source = new File(uriTemporaire);
  // Déplacée et pas copiée : aucune copie ne reste dans le cache ; si le déplacement échoue, on copie
  try {
    await source.move(destination);
  } catch {
    await source.copy(destination);
  }
  viderCacheSelecteur();
  return destination.uri;
}

/** Vide le cache disque des images, qui a pu garder une copie de la photo (avant que l'avatar passe au cache en mémoire seulement). */
function viderCacheImages(): void {
  void Image.clearDiskCache().catch(() => {
    // Cache déjà vide ou indisponible : rien de plus à faire
  });
}

/** Supprime une photo d'avatar gardée dans les fichiers de l'app (remplacée, retirée, ou tout effacer). */
export function supprimerPhotoAvatar(uri: string): void {
  if (surLeWeb) return;
  try {
    const fichier = retrouverPhoto(uri) ?? new File(uri);
    if (fichier.exists) fichier.delete();
  } catch {
    // Déjà partie : rien à faire
  }
  viderCacheSelecteur();
  viderCacheImages();
}

/** Efface l'avatar du téléphone, photo comprise (et celles qu'une ancienne version aurait oubliées). */
export async function effacerAvatarLocal(): Promise<void> {
  if (!surLeWeb) {
    try {
      for (const element of Paths.document.list()) if (element instanceof File && NOM_PHOTO.test(element.name)) element.delete();
    } catch {
      // Dossier illisible ou fichier déjà parti : rien de plus à faire
    }
    viderCacheSelecteur();
    viderCacheImages();
  }
  await AsyncStorage.removeItem(CLE);
}
