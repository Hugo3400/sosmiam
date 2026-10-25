import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { REGLES_IMAGES_LIEU, type ImageLieu } from "@sos-miam/commun/regles/images-lieu";

import { calculerRecadrageCentre } from "~/fonctions/photos/calculer-recadrage-centre";
import { lireFichierPhoto } from "~/fonctions/photos/lire-fichier-photo";
import { oublierFichierPhoto } from "~/fonctions/photos/oublier-fichier-photo";

const QUALITES_BANNIERE = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35];

export async function preparerImageLieuAEnvoyer(uri: string, quelle: ImageLieu): Promise<{ uri: string; fichier: Blob } | "trop-lourde"> {
  const regle = REGLES_IMAGES_LIEU[quelle];
  const contexte = ImageManipulator.manipulate(uri);
  const avant = await contexte.renderAsync();
  contexte.crop(calculerRecadrageCentre(avant.width, avant.height, regle.largeur / regle.hauteur)).resize({ width: regle.largeur, height: regle.hauteur });
  const image = await contexte.renderAsync();
  const essais = quelle === "logo" ? [{ format: SaveFormat.PNG }] : QUALITES_BANNIERE.map((compress) => ({ format: SaveFormat.JPEG, compress }));
  for (const reglage of essais) {
    const resultat = await image.saveAsync(reglage);
    const fichier = await lireFichierPhoto(resultat.uri);
    if ((fichier.size ?? Number.POSITIVE_INFINITY) <= regle.poidsMax) return { uri: resultat.uri, fichier };
    oublierFichierPhoto(resultat.uri);
  }
  return "trop-lourde";
}
