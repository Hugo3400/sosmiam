import type { TarifEvenement, TypeEvenement } from "../types/evenement.ts";

// Événements des lieux vérifiés (docs/decisions.md, « Décidé le 9 octobre 2026, au soir ») : publiés par le gérant ou
// l'équipe, 10 à venir par lieu, 3 mois à l'avance au plus, filtre de mots, signalables et modérés après. Alcool : caché
// aux 15-17 ans, avec le message sanitaire, jamais d'« open bar ».

const MINUTE_MS = 60_000;
const HEURE_MS = 60 * MINUTE_MS;
export const JOUR_MS = 24 * HEURE_MS;
export const SEMAINE_MS = 7 * JOUR_MS;

/** Les types, dans l'ordre du formulaire */
export const TYPES_EVENEMENT: readonly TypeEvenement[] = ["concert", "soiree-theme", "degustation", "atelier", "quiz", "match", "marche", "autre"];

export const TARIFS_EVENEMENT: readonly TarifEvenement[] = ["gratuit", "prix", "reservation"];

/** Titre (« Soirée jazz manouche »), espaces du début et de la fin retirés */
export const TITRE_EVENEMENT_MIN = 3;
export const TITRE_EVENEMENT_MAX = 60;

/** Description, facultative */
export const DESCRIPTION_EVENEMENT_MAX = 500;

/** Événements à venir (pas encore finis, pas annulés) par lieu */
export const EVENEMENTS_A_VENIR_MAX = 10;

/** « 3 mois à l'avance au plus », comptés 92 jours : pour le début, et pour la dernière date d'un événement de chaque semaine */
export const HORIZON_EVENEMENT_MS = 92 * JOUR_MS;

/** Un événement dure 24 h au plus (deux dates d'un événement de chaque semaine ne se chevauchent jamais) */
export const DUREE_EVENEMENT_MAX_MS = 24 * HEURE_MS;

/** Sans heure de fin, une date compte comme finie 3 h après son début (elle reste « ce soir » pendant ce temps-là) */
export const DUREE_SANS_FIN_MS = 3 * HEURE_MS;

/** Prix indicatif : de 0,01 € à 500 € */
export const PRIX_EVENEMENT_MAX_CENTIMES = 50_000;

/** Places limitées annoncées */
export const PLACES_EVENEMENT_MIN = 1;
export const PLACES_EVENEMENT_MAX = 500;

/** Dates d'un événement de chaque semaine, au plus (92 jours, avec de la marge) */
export const OCCURRENCES_EVENEMENT_MAX = 15;

/** L'équipe revoit ses événements finis (ou annulés) depuis 30 jours au plus */
export const JOURS_EVENEMENTS_PASSES_EQUIPE = 30;

/** Explorer : une période de 14 jours au plus par lecture, 200 dates au plus */
export const PERIODE_EVENEMENTS_MAX_MS = 14 * JOUR_MS;
export const EVENEMENTS_PAR_LECTURE = 200;

/** Fiche du lieu (« À venir ») : ses 20 prochaines dates au plus */
export const EVENEMENTS_PAR_LIEU = 20;

/**
 * Ce qui fait d'un événement avec alcool un « open bar », interdit (boire à volonté, sans limite, gratuitement) : cherché
 * dans le titre et la description simplifiés (minuscules, sans accent ni ponctuation). Un repas « à volonté » sans alcool
 * reste permis.
 */
export const EXPRESSIONS_OPEN_BAR: readonly RegExp[] = [
  /\bopen ?bars?\b/,
  /\ba volonte\b/,
  /\billimite(e|s|es)?\b/,
  /\bsans limite(s)?\b/,
  /\ba gogo\b/,
  /\bfree ?drinks?\b/,
  /\bforfaits? (boissons?|alcool|a boire|consos?)\b/,
  /\bgratuit(e|s|es)? a boire\b/,
  /\ba boire gratuit/,
  // « Boissons gratuites », « l'alcool est gratuit » (un seul verre offert reste permis)
  /\b(boissons|consos|consommations|alcools?) (est |sont )?(gratuit|offert)/,
];
