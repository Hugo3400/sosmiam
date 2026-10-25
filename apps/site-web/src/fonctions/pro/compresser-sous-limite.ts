export const QUALITES_JPEG_IMAGE_LIEU = [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6] as const;

export type ImageCompressee = { ok: true; image: Blob; qualite: number } | { ok: false; erreur: "trop-lourde" | "encodage" };

export async function compresserSousLimite(
  encoder: (qualite: number) => Promise<Blob | null>,
  poidsMax: number,
  qualites: readonly number[] = QUALITES_JPEG_IMAGE_LIEU,
): Promise<ImageCompressee> {
  let encodee = false;
  for (const qualite of qualites) {
    const image = await encoder(qualite);
    if (!image || image.size === 0) continue;
    encodee = true;
    if (image.size <= poidsMax) return { ok: true, image, qualite };
  }
  return { ok: false, erreur: encodee ? "trop-lourde" : "encodage" };
}
