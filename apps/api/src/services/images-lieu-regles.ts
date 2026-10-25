import type { ImageLieu } from "../../../../packages/commun/src/regles/images-lieu.ts";
import type { RoleRattachement } from "./pro-regles.ts";
import type { StockagePhotosAvis } from "./stockage-photos-avis.ts";

const HEURE_MS = 3600_000;

export const DELAI_ORPHELIN_IMAGE_LIEU_MS = 24 * HEURE_MS;
export const IMAGES_LIEU_PAR_PASSAGE_DE_MENAGE = 200;
export const ATTENTE_STOCKAGE_PLEIN_IMAGE_LIEU_SECONDES = 3600;
export const CACHE_IMAGE_LIEU_PUBLIQUE = "public, max-age=31536000, immutable";

export type ErreurImageLieu = "image-lieu-invalide" | "image-lieu-trop-lourde" | "stockage-plein" | "role-requis" | "reserve-au-gerant" | "lieu-inconnu";
export type RefusImageLieu = { ok: false; erreur: ErreurImageLieu };

export const STATUTS_REFUS_IMAGE_LIEU: Readonly<Record<ErreurImageLieu, number>> = {
  "image-lieu-invalide": 400,
  "image-lieu-trop-lourde": 413,
  "stockage-plein": 503,
  "role-requis": 403,
  "reserve-au-gerant": 403,
  "lieu-inconnu": 404,
};

export type ImagesDuLieu = { banniere: string | null; logo: string | null };

export type TransactionImagesLieu = {
  verrouillerLieu(lieuId: number): Promise<ImagesDuLieu | null>;
  ecrireImage(lieuId: number, quelle: ImageLieu, nom: string | null, quand: Date): Promise<void>;
};

export interface DepotImagesLieu {
  ecrire<T>(faire: (t: TransactionImagesLieu) => Promise<T>): Promise<T>;
  lireLieuDeLImage(nom: string): Promise<{ lieuId: number; publie: boolean } | null>;
  listerImagesCitees(noms: readonly string[]): Promise<Set<string>>;
}

export type StockagesImagesLieu = Readonly<Record<ImageLieu, StockagePhotosAvis>>;

export type DependancesImagesLieu = {
  stockages: StockagesImagesLieu;
  depot: DepotImagesLieu;
  lireRole: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>;
  horloge?: () => number;
};
