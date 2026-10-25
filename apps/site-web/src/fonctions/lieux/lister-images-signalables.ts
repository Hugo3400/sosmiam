import type { FichePublique } from "~/types/pro";

export type ImageSignalable = "banniere" | "logo";

export function listerImagesSignalables(lieu: Pick<FichePublique, "estVerifie" | "banniere" | "logo">): ImageSignalable[] {
  if (!lieu.estVerifie) return [];
  const images: ImageSignalable[] = [];
  if (lieu.banniere) images.push("banniere");
  if (lieu.logo) images.push("logo");
  return images;
}
