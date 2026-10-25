import type { ImageLieu } from "@sos-miam/commun/regles/images-lieu";

const posees = new Map<number, Partial<Record<ImageLieu, string | null>>>();

export const lireImageLieuPoseeDemo = (lieuId: number, quelle: ImageLieu): string | null | undefined => posees.get(lieuId)?.[quelle];

export function poserImageLieuDemo(lieuId: number, quelle: ImageLieu, adresse: string | null): void {
  posees.set(lieuId, { ...posees.get(lieuId), [quelle]: adresse });
}
