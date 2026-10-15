import type { TrancheAge } from "../types/sorties-miamis.ts";

export const MAX_PLACES_SORTIE_MIAMIS = 6;
export const MIN_PLACES_SORTIE_MIAMIS = 2;
export const MAX_ETIQUETTES_SORTIE_MIAMIS = 5;
export const LONGUEUR_MAX_DESCRIPTION_SORTIE_MIAMIS = 300;
export const JOURS_NOUVEAU_DANS_L_APP = 30;
export const HEURE_RAPPEL_VEILLE = 18;
export const PRESENCE_OUVERTE_MINUTES_AVANT = 60;
export const PRESENCE_OUVERTE_MINUTES_APRES = 240;

export const TRANCHES_AGE: readonly TrancheAge[] = ["18-25", "25-35", "30-plus", "40-plus"];

export const BORNES_TRANCHES_AGE: Readonly<Record<TrancheAge, { min: number; max: number | null }>> = {
  "18-25": { min: 18, max: 25 },
  "25-35": { min: 25, max: 35 },
  "30-plus": { min: 30, max: null },
  "40-plus": { min: 40, max: null },
};
