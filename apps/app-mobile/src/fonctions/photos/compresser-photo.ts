import { ImageManipulator, SaveFormat, type ImageRef } from "expo-image-manipulator";

import { POIDS_MAX_PHOTO_ENVOYEE } from "@sos-miam/commun/regles/photos";

import { lireFichierPhoto } from "~/fonctions/photos/lire-fichier-photo";
import { oublierFichierPhoto } from "~/fonctions/photos/oublier-fichier-photo";
import { reduireJusquAuPoids } from "~/fonctions/photos/reduire-jusqu-au-poids";

export async function compresserPhoto(image: ImageRef, echelles: readonly number[]): Promise<{ uri: string; largeur: number; hauteur: number }> {
  const parEchelle = new Map<number, Promise<ImageRef>>();
  const lireImage = (echelle: number) => {
    if (echelle === 1) return Promise.resolve(image);
    let reduite = parEchelle.get(echelle);
    if (!reduite) {
      const largeur = Math.max(1, Math.round(image.width * echelle));
      reduite = ImageManipulator.manipulate(image).resize({ width: largeur }).renderAsync();
      parEchelle.set(echelle, reduite);
    }
    return reduite;
  };
  const photo = await reduireJusquAuPoids(
    async (qualite, echelle) => {
      const resultat = await (await lireImage(echelle)).saveAsync({ compress: qualite, format: SaveFormat.JPEG });
      const poids = (await lireFichierPhoto(resultat.uri)).size ?? Number.POSITIVE_INFINITY;
      return { uri: resultat.uri, largeur: resultat.width, hauteur: resultat.height, poids };
    },
    POIDS_MAX_PHOTO_ENVOYEE,
    echelles,
    oublierFichierPhoto,
  );
  return { uri: photo.uri, largeur: photo.largeur, hauteur: photo.hauteur };
}
