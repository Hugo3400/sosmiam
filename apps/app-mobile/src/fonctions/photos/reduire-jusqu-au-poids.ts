export type PhotoEncodee = { uri: string; largeur: number; hauteur: number; poids: number };

export type EncoderPhoto = (qualite: number, echelle: number) => Promise<PhotoEncodee>;

export const QUALITES_PHOTO = [0.85, 0.75, 0.65, 0.55, 0.45] as const;

export async function reduireJusquAuPoids(
  encoder: EncoderPhoto,
  poidsMax: number,
  echelles: readonly number[],
  oublier: (uri: string) => void,
): Promise<PhotoEncodee> {
  for (const echelle of echelles) {
    for (const qualite of QUALITES_PHOTO) {
      const photo = await encoder(qualite, echelle);
      if (photo.poids <= poidsMax) return photo;
      oublier(photo.uri);
    }
  }
  throw new Error("photo-trop-lourde");
}
