import type { MotifRefusReservation } from "../types/reservation.ts";

// Réservations dans l'app : taille des groupes, créneaux, « Je suis là », « Venu », absences et annulations
// (voir docs/decisions.md, « Scan et validation des visites »). Toutes les heures sont celles du lieu (Paris).

/** Taille d'un groupe : au-delà, on appelle directement le lieu */
export const PERSONNES_RESERVATION_MIN = 1;
export const PERSONNES_RESERVATION_MAX = 12;

/** On réserve au plus 30 jours à l'avance (aujourd'hui compris) */
export const JOURS_RESERVATION_MAX = 30;

/** Un créneau commence au moins 30 min après la demande */
export const DELAI_MIN_RESERVATION_MS = 30 * 60_000;

/** Les créneaux tombent toutes les 30 min (« 19:00 », « 19:30 »…) */
export const PAS_CRENEAUX_MIN = 30;

/** Le petit mot facultatif du client au lieu */
export const MESSAGE_RESERVATION_MAX = 140;

/** « Je suis là » (position vérifiée) : d'une heure avant le créneau à 4 h après */
export const PRESENCE_AVANT_CRENEAU_MS = 60 * 60_000;
export const PRESENCE_APRES_CRENEAU_MS = 4 * 60 * 60_000;

/** « Venu », touché par le lieu : de 30 min avant le créneau à 4 h après */
export const VENU_AVANT_CRENEAU_MS = 30 * 60_000;
export const VENU_APRES_CRENEAU_MS = 4 * 60 * 60_000;

/** « Pas venu » : seulement 30 min après le créneau (si c'est juste du retard, on attend un peu) */
export const ABSENT_APRES_CRENEAU_MS = 30 * 60_000;

/** Une demande sans réponse expire 30 min avant le créneau ; le lieu ne peut plus l'accepter */
export const EXPIRATION_AVANT_CRENEAU_MS = 30 * 60_000;

/** Annuler une réservation acceptée moins de 2 h avant le créneau, c'est une annulation tardive */
export const ANNULATION_TARDIVE_MS = 2 * 60 * 60_000;

/** Une demande en attente par lieu, et 3 réservations à venir au plus par compte */
export const RESERVATIONS_EN_ATTENTE_PAR_LIEU = 1;
export const RESERVATIONS_A_VENIR_MAX = 3;

/** Motifs fermés d'un refus ou d'une annulation par le lieu : jamais de texte libre du lieu vers le client */
export const MOTIFS_REFUS_RESERVATION: readonly MotifRefusReservation[] = ["complet", "ferme", "groupe-trop-grand", "autre"];
