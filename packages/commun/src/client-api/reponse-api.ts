// Forme commune des réponses de tous les services (démo, API, indisponible), et de leurs abonnements.

import type { ErreurService } from "../types/erreurs-service.ts";

/** De quoi remplir le texte d'une erreur (remplirModele) ; jamais de position du téléphone */
export type DetailsErreur = { distanceM?: number; precisionM?: number; jusqua?: string; lieu?: string; attenteS?: number; lieuId?: number };

/** Même forme que les réponses de l'API déjà lues par le site : { ok: true, … } | { ok: false, erreur, … } */
export type ReponseApi<T extends object = Record<never, never>> =
  | ({ ok: true } & T)
  | { ok: false; erreur: ErreurService; details?: DetailsErreur; champ?: string };

/** Rendu par ecouter() : à appeler pour ne plus être prévenu */
export type Desabonner = () => void;
