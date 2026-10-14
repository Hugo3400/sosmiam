import type { FiltreDefi, MesureDefi } from "../types/defi.ts";
import type { TypeLieu } from "../types/lieu.ts";

// Défis de l'app (décidé le 14 octobre 2026, docs/decisions.md « Majorité, fidélité et défis ») : écrits dans le logiciel
// de gestion (validerDefi), comptés par le serveur entre le premier et le dernier jour (heure de Paris), points crédités une
// seule fois et repris si l'avancée retombe avant la fin.

export const EMOJI_DEFI_MAX = 16;
export const TITRE_DEFI_MAX = 60;
export const TEXTE_DEFI_MAX = 300;
export const OBJECTIF_DEFI_MIN = 1;
export const OBJECTIF_DEFI_MAX = 100;
export const POINTS_DEFI_MIN = 0;
export const POINTS_DEFI_MAX = 200;
export const ORDRE_DEFI_MAX = 999;

/** Les mesures connues, dans l'ordre du formulaire du logiciel */
export const MESURES_DEFI: readonly MesureDefi[] = [
  "rescousses", "premiers-sauvetages", "visites", "lieux-differents", "villes-differentes", "semaines-d-affilee", "avis",
];

/** Les filtres permis pour chaque mesure (les autres sont refusés par validerDefi) */
export const FILTRES_PAR_MESURE: Readonly<Record<MesureDefi, readonly FiltreDefi[]>> = {
  rescousses: [],
  "premiers-sauvetages": [],
  visites: ["typesLieu", "apresHeure", "pendantSos"],
  "lieux-differents": ["typesLieu", "apresHeure", "pendantSos"],
  "villes-differentes": ["typesLieu"],
  "semaines-d-affilee": ["typesLieu"],
  avis: ["avecPhoto"],
};

/**
 * Types de lieu qu'un défi peut viser. Jamais « bar » : un défi rapporte des points, et des points pour aller au bar
 * pousseraient à boire (loi Évin, même raison que le badge Noctambule, passé de « 3 bars » à « 3 visites après 22 h »).
 * Un défi sans filtre de type compte tous les lieux, bars compris, comme le badge Noctambule.
 */
export const TYPES_LIEU_DEFI: readonly TypeLieu[] = ["resto", "patisserie", "sortie"];

/** Emojis d'alcool, refusés pour un défi (même raison : un défi rapporte des points) */
export const EMOJIS_ALCOOL_DEFI: readonly string[] = ["🍺", "🍻", "🍷", "🍸", "🍹", "🥂", "🥃", "🍾", "🍶"];

/** `apresHeure` : de 12 h à 23 h (heure de Paris) ; une visite compte de cette heure-là jusqu'à 5 h du matin */
export const APRES_HEURE_MIN = 12;
export const APRES_HEURE_MAX = 23;
export const FIN_DE_NUIT_HEURE = 5;

/**
 * Après son dernier jour, un défi pas encore réussi peut encore l'être pendant 7 jours, si les faits de sa période
 * suffisent (un avis écrit le dernier soir, relu le lendemain dans l'app). Ensuite, il est figé.
 */
export const JOURS_RATTRAPAGE_DEFI = 7;
