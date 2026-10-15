import type { AvatarPhoto } from "../../../../packages/commun/src/types/photo-profil.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";
import type { StockagePhotosAvis } from "./stockage-photos-avis.ts";

const HEURE_MS = 3600_000;

export const DELAI_ORPHELIN_PHOTO_PROFIL_MS = 24 * HEURE_MS;
export const PHOTOS_PROFIL_PAR_PASSAGE_DE_MENAGE = 200;
export const ATTENTE_STOCKAGE_PLEIN_PHOTO_PROFIL_SECONDES = 3600;
export const CACHE_PHOTO_PROFIL_PUBLIQUE = "public, max-age=31536000, immutable";

export type ErreurPhotoProfil = "format-refuse" | "media-trop-lourd" | "media-invalide" | "stockage-plein" | "chiffrement-indisponible" | "compte-inconnu";
export type RefusPhotoProfil = { ok: false; erreur: ErreurPhotoProfil; champ?: "format" | "dimensions" };

export const STATUTS_REFUS_PHOTO_PROFIL: Readonly<Record<ErreurPhotoProfil, number>> = {
  "format-refuse": 415,
  "media-trop-lourd": 413,
  "media-invalide": 400,
  "stockage-plein": 503,
  "chiffrement-indisponible": 503,
  "compte-inconnu": 401,
};

export type RaisonRetraitPhoto = "personne" | "moderation" | "compte-supprime";

export type PhotoEnvoyee = { ok: true; avatar: AvatarPhoto };
export type PhotoRetiree = { ok: true; avatar: string | null; retiree: boolean };

export type StockagePhotosProfil = StockagePhotosAvis;

export type PhotoDuCompte = { photo: string | null; avatar: string | null };

export type TransactionPhotosProfil = {
  verrouillerCompte(compteId: number): Promise<PhotoDuCompte | null>;
  ecrirePhoto(compteId: number, photo: string | null): Promise<void>;
  listerSignalementsAGarder(compteId: number, depuis: Date, seuil: Date): Promise<number[]>;
  citerPreuve(signalementIds: readonly number[], fichier: string): Promise<number>;
};

export type SignalementDeProfil = { auteurContenuId: number | null; fichierMedia: string | null; creeLe: Date };

export interface DepotPhotosProfil {
  ecrire<T>(faire: (t: TransactionPhotosProfil) => Promise<T>): Promise<T>;
  lireTitulaire(photo: string, maintenant: Date): Promise<{ compteId: number; limite: boolean } | null>;
  bloqueEntre(a: number, b: number): Promise<boolean>;
  listerPhotosCitees(photos: readonly string[]): Promise<Set<string>>;
  lirePhoto(compteId: number): Promise<string | null>;
  lireSignalementDeProfil(signalementId: number): Promise<SignalementDeProfil | null>;
}

export type PreuvesPhotosProfil = {
  chiffrement: Pick<ChiffrementSocial, "chiffrerOctets" | "dechiffrerOctets"> | null;
  medias: Pick<StockageMediasChat, "tirerNom" | "ecrire" | "lire">;
};

export type DependancesPhotosProfil = {
  stockage: StockagePhotosProfil;
  depot: DepotPhotosProfil;
  preuves: PreuvesPhotosProfil | null;
  horloge?: () => number;
};
