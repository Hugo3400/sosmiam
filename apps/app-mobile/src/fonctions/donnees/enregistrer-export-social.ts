import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { ExportSocialApi } from "@sos-miam/commun/types/export-social";

/**
 * Tes données sociales (le JSON de GET /app/social/export) dans un fichier, ouvert dans la feuille de partage du téléphone
 * (Fichiers, mail, AirDrop…). Le fichier n'existe que le temps du partage, dans le cache de l'app. « indisponible » : pas de
 * feuille de partage (aperçu web).
 */
export async function enregistrerExportSocial(donnees: ExportSocialApi, maintenant: Date): Promise<"partage" | "indisponible"> {
  if (Platform.OS === "web" || !(await Sharing.isAvailableAsync())) return "indisponible";
  const fichier = new File(Paths.cache, `sos-miam-mes-donnees-sociales-${maintenant.toISOString().slice(0, 10)}.json`);
  if (fichier.exists) fichier.delete();
  fichier.create();
  fichier.write(JSON.stringify(donnees, null, 2));
  try {
    await Sharing.shareAsync(fichier.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle: "Tes données sociales" });
  } finally {
    // Partagé (ou feuille refermée) : la copie ne reste pas sur le téléphone
    if (fichier.exists) fichier.delete();
  }
  return "partage";
}
