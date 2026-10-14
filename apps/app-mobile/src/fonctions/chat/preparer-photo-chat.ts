import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/** Le plus grand côté d'une photo envoyée dans le chat */
const COTE_MAX = 2048;

/**
 * Prépare une photo avant de l'envoyer dans le chat : redressée (l'orientation de l'appareil photo est appliquée), réduite à
 * 2 048 px au plus grand côté, en JPEG à 0,7, et réécrite sans ses métadonnées (position GPS, appareil…). Le serveur les
 * retire de toute façon : c'est pour envoyer moins lourd et ne rien laisser partir. Rend l'adresse du fichier préparé.
 */
export async function preparerPhotoChat(uri: string): Promise<{ uri: string; largeur: number; hauteur: number }> {
  const contexte = ImageManipulator.manipulate(uri);
  const avant = await contexte.renderAsync();
  const grand = Math.max(avant.width, avant.height);
  if (grand > COTE_MAX) {
    contexte.resize(avant.width >= avant.height ? { width: COTE_MAX } : { height: COTE_MAX });
  }
  const image = grand > COTE_MAX ? await contexte.renderAsync() : avant;
  const resultat = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return { uri: resultat.uri, largeur: resultat.width, hauteur: resultat.height };
}
