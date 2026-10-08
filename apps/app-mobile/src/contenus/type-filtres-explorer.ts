import type { Lieu, TypeLieu } from "@sos-miam/commun/types/lieu";

/** Ce qu'on a choisi dans Explorer pour trier et filtrer les lieux. */
export type FiltresExplorer = {
  /** Recherche libre : nom, ce que c'est, plat, étiquettes, quartier, ville */
  texte: string;
  type: TypeLieu | "tous";
  /** Ville choisie, ou null pour toutes */
  ville: string | null;
  /** Budgets cochés (vide : tous) */
  budgets: Lieu["prix"][];
  ouvertMaintenant: boolean;
};

export const FILTRES_EXPLORER_PAR_DEFAUT: FiltresExplorer = { texte: "", type: "tous", ville: null, budgets: [], ouvertMaintenant: false };
