// Chat entre potes (démo) gardé sur le téléphone en attendant l'API : les conversations, et les photos et notes vocales
// copiées dans les fichiers de l'app (dossier « chat »). Sur le web (aperçu), on garde l'adresse donnée par le navigateur.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import type { Conversation } from "@sos-miam/commun/types/conversations";

const CLE = "sosmiam.conversations";
const surLeWeb = Platform.OS === "web";

/** Lit les conversations gardées sur le téléphone (null si rien, ou illisible : la démo repart alors de zéro). */
export async function lireConversationsLocales(): Promise<Conversation[] | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return null;
    const lu: unknown = JSON.parse(brut);
    return Array.isArray(lu) ? (lu as Conversation[]) : null;
  } catch {
    return null;
  }
}

/** Enregistre les conversations sur le téléphone. */
export async function enregistrerConversationsLocales(conversations: Conversation[]): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(conversations));
}

/** Range une photo ou une note vocale (fichier temporaire) dans le dossier « chat » de l'app et renvoie son adresse. */
export async function garderFichierChat(uriTemporaire: string, extension: string): Promise<string> {
  if (surLeWeb) return uriTemporaire;
  const dossier = new Directory(Paths.document, "chat");
  if (!dossier.exists) dossier.create();
  const destination = new File(dossier, `${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${extension}`);
  await new File(uriTemporaire).copy(destination);
  return destination.uri;
}

/** Efface les conversations et tous les fichiers du chat. */
export async function effacerConversationsLocales(): Promise<void> {
  if (!surLeWeb) {
    try {
      const dossier = new Directory(Paths.document, "chat");
      if (dossier.exists) dossier.delete();
    } catch {
      // Déjà parti
    }
  }
  await AsyncStorage.removeItem(CLE);
}
