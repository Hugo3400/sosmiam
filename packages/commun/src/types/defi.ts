// Défis de l'app (décidé le 14 octobre 2026, docs/decisions.md « Majorité, fidélité et défis ») : la liste est gérée dans
// le logiciel de gestion, le serveur compte l'avancée de chacun (jours à l'heure de Paris) et crédite les points une fois.
// Règles et limites dans regles/defis.ts, vérification dans validation/valider-defi.ts.

import type { TypeLieu } from "./lieu.ts";

/** Ce qu'un défi (ou un badge automatique) compte dans l'activité du compte */
export type MesureDefi =
  /** Rescousses données (une reprise la retire) */
  | "rescousses"
  /** Lieux dont on est le premier sauveteur */
  | "premiers-sauvetages"
  /** Visites validées */
  | "visites"
  /** Lieux différents des visites validées */
  | "lieux-differents"
  /** Villes différentes des visites validées */
  | "villes-differentes"
  /** Plus longue suite de semaines (lundi → dimanche, à Paris) avec au moins une visite validée */
  | "semaines-d-affilee"
  /** Avis publiés */
  | "avis";

/**
 * Filtres d'une mesure (ceux permis pour chaque mesure : FILTRES_PAR_MESURE). `apresHeure` : heure de Paris de la
 * validation à partir de laquelle une visite compte, jusqu'à 5 h du matin (22 : une visite à 0 h 30 compte aussi).
 */
export type FiltresDefi = { typesLieu?: TypeLieu[]; apresHeure?: number; pendantSos?: boolean; avecPhoto?: boolean };

export type FiltreDefi = keyof FiltresDefi;

/** « a-venir » : pas commencé ; « termine » : fini sans être réussi (le serveur ne le rend pas) */
export type EtatDefi = "a-venir" | "en-cours" | "reussi" | "termine";

/** Un défi tel que l'app le lit (GET /app/defis), avec l'avancée du compte connecté */
export type DefiApp = {
  id: number;
  emoji: string;
  titre: string;
  texte: string;
  objectif: number;
  /** Avancée, entre 0 et l'objectif (l'objectif une fois réussi) */
  fait: number;
  /** Ce qu'il rapporte ; une fois réussi, les points crédités (figés à la réussite, même si le défi change ensuite) */
  points: number;
  /** Premier jour compté, « AAAA-MM-JJ » à l'heure de Paris */
  debut: string;
  /** Dernier jour compté (compris) ; null : sans fin */
  fin: string | null;
  etat: EtatDefi;
  /** Réussi le (ISO 8601) ; null sinon */
  reussiLe: string | null;
};

/** Un défi tel que le logiciel de gestion l'écrit (création, ou modification complète après fusion) */
export type BrouillonDefi = {
  emoji: string;
  titre: string;
  texte: string;
  mesure: MesureDefi;
  /** null : pas de filtre */
  filtres: FiltresDefi | null;
  objectif: number;
  points: number;
  debut: string;
  fin: string | null;
  /** Visible dans l'app ; un brouillon reste dans le logiciel */
  publie: boolean;
  /** Ordre d'affichage, le plus petit d'abord */
  ordre: number;
};

export type ChampDefi = keyof BrouillonDefi;

/** Un défi tel que le logiciel de gestion le lit, brouillons compris */
export type DefiGestion = BrouillonDefi & {
  id: number;
  /** Comptes qui l'ont réussi : dès 1, mesure, filtres et objectif ne changent plus, et il ne se supprime plus */
  reussites: number;
  creeLe: string;
  modifieLe: string;
};

/** Une visite validée, telle que les mesures la comptent (jamais une visite offerte par le lieu : elle ne rapporte rien) */
export type VisiteDefi = { le: number; lieuId: number; typeLieu: string; ville: string; pendantSos: boolean };

/** Les faits datés d'un compte que les mesures comptent (instants en millisecondes UTC) */
export type FaitsDefi = {
  rescousses: number[];
  premiersSauvetages: number[];
  visites: VisiteDefi[];
  /** Avis vérifiés publiés (un avis non vérifié ne rapporte rien) ; avecPhoto : jamais pour un repas offert */
  avis: { le: number; avecPhoto: boolean }[];
};

/** Jours de Paris comptés, « AAAA-MM-JJ » compris ; null : sans borne de ce côté */
export type PeriodeDefi = { debut: string | null; fin: string | null };
