// Les photos et notes vocales du chat entre potes rangées dans les fichiers de l'app (dossier « chat »), et l'ancienne copie
// des conversations gardée sur le téléphone avant l'API, effacée avec elles. Sur le web (aperçu), on garde l'adresse donnée
// par le navigateur. Sur le téléphone, un message ne garde que « chat/<nom du fichier> » : iOS peut changer le dossier de l'app (mise à jour de l'app
// ou d'Expo Go), on refait donc l'adresse complète à chaque affichage.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const CLE = "sosmiam.conversations";
const DOSSIER = "chat";
const surLeWeb = Platform.OS === "web";

/**
 * Range une photo ou une note vocale (fichier temporaire) dans le dossier « chat » de l'app et renvoie ce que garde le message :
 * « chat/<nom> ». Déplacée plutôt que copiée : aucune copie ne traîne dans le cache (si le déplacement échoue, on copie).
 */
export async function garderFichierChat(uriTemporaire: string, extension: string): Promise<string> {
  if (surLeWeb) return uriTemporaire;
  const dossier = new Directory(Paths.document, DOSSIER);
  if (!dossier.exists) dossier.create();
  const nom = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${extension}`;
  const destination = new File(dossier, nom);
  const source = new File(uriTemporaire);
  try {
    await source.move(destination);
  } catch {
    await source.copy(destination);
  }
  return `${DOSSIER}/${nom}`;
}

/**
 * L'adresse actuelle d'une photo ou d'une note du chat, à partir de ce que garde le message : « chat/<nom> », ou l'adresse complète
 * d'un message plus ancien (dont seul le nom compte encore). Sur le web, l'adresse du navigateur telle quelle.
 */
export function retrouverFichierChat(fichier: string): string {
  if (surLeWeb) return fichier;
  const nom = fichier.split("/").pop() ?? "";
  try {
    return new File(Paths.document, DOSSIER, nom).uri;
  } catch {
    return fichier;
  }
}

/** Supprime des photos et notes vocales du chat (groupe quitté). */
export function supprimerFichiersChat(fichiers: string[]): void {
  if (surLeWeb) return;
  for (const fichier of fichiers) {
    try {
      const present = new File(retrouverFichierChat(fichier));
      if (present.exists) present.delete();
    } catch {
      // Déjà parti : rien à faire
    }
  }
}

/** Efface les conversations et tous les fichiers du chat. */
export async function effacerConversationsLocales(): Promise<void> {
  if (!surLeWeb) {
    try {
      const dossier = new Directory(Paths.document, DOSSIER);
      if (dossier.exists) dossier.delete();
    } catch {
      // Déjà parti
    }
  }
  await AsyncStorage.removeItem(CLE);
}
