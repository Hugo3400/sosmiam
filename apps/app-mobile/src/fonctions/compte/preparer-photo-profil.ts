import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { COTE_PHOTO_PROFIL } from "@sos-miam/commun/regles/photo-profil";

const QUALITE_JPEG = 0.85;

export async function preparerPhotoProfil(uri: string): Promise<string> {
  const contexte = ImageManipulator.manipulate(uri);
  const avant = await contexte.renderAsync();
  const cote = Math.min(avant.width, avant.height);
  contexte.crop({ originX: Math.floor((avant.width - cote) / 2), originY: Math.floor((avant.height - cote) / 2), width: cote, height: cote });
  contexte.resize({ width: COTE_PHOTO_PROFIL, height: COTE_PHOTO_PROFIL });
  const image = await contexte.renderAsync();
  const resultat = await image.saveAsync({ compress: QUALITE_JPEG, format: SaveFormat.JPEG });
  if (resultat.width !== COTE_PHOTO_PROFIL || resultat.height !== COTE_PHOTO_PROFIL) throw new Error("photo-mal-preparee");
  return resultat.uri;
}
