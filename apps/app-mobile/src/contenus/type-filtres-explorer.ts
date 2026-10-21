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
  /** Seulement les lieux qui ont un événement ce soir ou ce week-end (null : pas de filtre) */
  evenement: PeriodeEvenements | null;
  etiquette: string | null;
};

/** « Ce soir » : jusqu'à 4 h du matin ; « ce week-end » : du vendredi 18 h au lundi 4 h */
export type PeriodeEvenements = "ce-soir" | "ce-week-end";

export const FILTRES_EXPLORER_PAR_DEFAUT: FiltresExplorer = { texte: "", type: "tous", ville: null, budgets: [], ouvertMaintenant: false, evenement: null, etiquette: null };
