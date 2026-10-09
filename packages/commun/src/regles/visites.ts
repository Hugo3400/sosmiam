import type { MotifRefusVisite } from "../types/visite.ts";

// Validation des visites : position, QR du comptoir, addition demandée, annulation et avis (voir docs/decisions.md,
// « Scan et validation des visites »). Délais confirmés par Hugo le 8 octobre 2026.

/** Rayon autour du lieu dans lequel une visite peut être validée (réglable par lieu dans la gestion, de 100 à 500 m) */
export const RAYON_VALIDATION_M = 200;
export const RAYON_VALIDATION_MIN_M = 100;
export const RAYON_VALIDATION_MAX_M = 500;

/** Tolérance maximale accordée à l'imprécision du téléphone (on retire au plus 150 m de la distance) */
export const PRECISION_PLAFOND_M = 150;

/** Au-delà de ce rayon d'incertitude, la lecture est « imprecise » et refusée partout */
export const PRECISION_MAX_M = 500;

/** Une lecture de position plus vieille que ça est « perimee » */
export const AGE_POSITION_MAX_MS = 60_000;

/** Rayon de la liste « Tu es où ? » (lieux proches où demander l'addition) */
export const RAYON_LIEUX_PROCHES_M = 300;

/** Le QR du comptoir change toutes les 30 secondes */
export const DUREE_FENETRE_QR_MS = 30_000;

/** Fenêtres acceptées : celle en cours et la précédente, soit 60 s au plus */
export const FENETRES_QR_ACCEPTEES = 2;

/** Un QR montré par l'équipe s'éteint au bout de 2 minutes (ou quand tout le monde a scanné) */
export const DUREE_PRESENTATION_QR_MS = 120_000;

/** Nombre de personnes au plus pour un même QR montré (1 par défaut) */
export const PERSONNES_PRESENTATION_MAX = 12;

/** Une addition demandée dans l'app doit être validée dans les 30 minutes */
export const DUREE_DEMANDE_ADDITION_MS = 30 * 60_000;

/** Dès 2 additions en attente, l'équipe tape les 4 chiffres que montre le client */
export const DEMANDES_AVANT_SAISIE_CODE = 2;

/** Le lieu peut annuler une validation pendant 15 minutes */
export const DELAI_ANNULATION_LIEU_MS = 15 * 60_000;

/** Réductions que l'équipe peut indiquer en validant (liste fermée, décidé le 9 octobre 2026) */
export const REDUCTIONS_POURCENT: readonly number[] = [10, 15, 20, 25, 30, 50];

/** L'avis s'ouvre une heure après la visite, à tête reposée */
export const DELAI_INVITATION_AVIS_MS = 60 * 60_000;

/** Puis il reste ouvert 14 jours */
export const DUREE_INVITATION_AVIS_MS = 14 * 24 * 60 * 60_000;

/** Le client relit sa demande d'addition toutes les 4 secondes */
export const INTERVALLE_SUIVI_DEMANDE_MS = 4_000;

/** L'écran du comptoir se rafraîchit toutes les 5 secondes */
export const INTERVALLE_ECRAN_COMPTOIR_MS = 5_000;

/** Après une erreur réseau, l'écran du comptoir retente au bout d'une minute */
export const DUREE_NOUVEL_ESSAI_COMPTOIR_MS = 60_000;

/** Motifs fermés d'un refus (ou d'une annulation) par le lieu : jamais de mot libre vers le client */
export const MOTIFS_REFUS_VISITE: readonly MotifRefusVisite[] = ["introuvable", "pas-venu", "doublon", "autre"];
