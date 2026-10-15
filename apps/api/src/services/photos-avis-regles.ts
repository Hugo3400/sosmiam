import { COTE_MAX_PHOTO_CHAT } from "../../../../packages/commun/src/regles/chat.ts";
import { DUREE_CONTESTATION_JOURS } from "../../../../packages/commun/src/regles/signalement.ts";
import type { StatutAvis } from "../../../../packages/commun/src/types/avis.ts";
import type { Signalement } from "../base-de-donnees/client-genere/client.ts";

const HEURE_MS = 3600_000;

export const TAILLE_MAX_PHOTO_AVIS = 6 * 1024 * 1024;
export const COTE_MAX_PHOTO_AVIS = COTE_MAX_PHOTO_CHAT;
export const DELAI_UTILISATION_PHOTO_AVIS_MS = 24 * HEURE_MS;
export const DELAI_MENAGE_PHOTO_AVIS_MS = 25 * HEURE_MS;
export const DELAI_GARDE_PHOTO_AVIS_MASQUE_MS = DUREE_CONTESTATION_JOURS * 24 * HEURE_MS;
export const ATTENTE_STOCKAGE_PLEIN_PHOTOS_AVIS_SECONDES = 3600;
export const PHOTOS_AVIS_PAR_PASSAGE_DE_MENAGE = 200;

export type ErreurPhotoAvis = "format-refuse" | "media-trop-lourd" | "media-invalide" | "stockage-plein";
export type ChampPhotoAvis = "format" | "dimensions";
export type RefusPhotoAvis = { ok: false; erreur: ErreurPhotoAvis; champ?: ChampPhotoAvis };

export const STATUTS_REFUS_PHOTO_AVIS: Readonly<Record<ErreurPhotoAvis, number>> = {
  "format-refuse": 415,
  "media-trop-lourd": 413,
  "media-invalide": 400,
  "stockage-plein": 503,
};

export type CitationPhotoAvis = {
  photo: string;
  avisId: number;
  statut: StatutAvis;
  lieuPublie: boolean;
  creeLe: Date;
};

export type DecisionPhotoAvis = Pick<Signalement, "statut" | "contesteLe" | "reexamineLe" | "traiteLe"> & { avisId: number };

export interface CitationsPhotosAvis {
  lister(photos: readonly string[]): Promise<CitationPhotoAvis[]>;
  listerDecisions(avisIds: readonly number[]): Promise<DecisionPhotoAvis[]>;
}

export type SeuilsMenagePhotosAvis = { orphelins: Date; contestation: Date };

export function calculerSeuilsMenagePhotosAvis(maintenant: Date): SeuilsMenagePhotosAvis {
  return {
    orphelins: new Date(maintenant.getTime() - DELAI_MENAGE_PHOTO_AVIS_MS),
    contestation: new Date(maintenant.getTime() - DELAI_GARDE_PHOTO_AVIS_MASQUE_MS),
  };
}
