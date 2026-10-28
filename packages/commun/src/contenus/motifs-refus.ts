// Libellés des motifs fermés de refus (jamais de texte libre du lieu vers le client).
// Côté lieu, le motif est dit franchement ; côté client, il est dit de façon neutre, sans accuser personne.

import type { MotifRefusReservation } from "../types/reservation.ts";
import type { MotifRefusVisite } from "../types/visite.ts";
import type { ParLangue, Traduction } from "../types/traduction.ts";
import { LIBELLES_MOTIF_REFUS_CLIENT_ANGLAIS, LIBELLES_MOTIF_REFUS_RESERVATION_ANGLAIS, LIBELLES_MOTIF_REFUS_VISITE_ANGLAIS } from "./anglais/motifs-refus.ts";

/** Ce que choisit l'équipe du lieu quand elle refuse (ou annule) une addition */
export const LIBELLES_MOTIF_REFUS_VISITE: Readonly<Record<MotifRefusVisite, string>> = {
  introuvable: "Je ne retrouve pas cette addition",
  "pas-venu": "Cette personne n'est pas là",
  doublon: "Déjà validée",
  autre: "Autre raison",
};

/** Ce que lit le client pour le même motif, en termes neutres */
export const LIBELLES_MOTIF_REFUS_CLIENT: Readonly<Record<MotifRefusVisite, string>> = {
  introuvable: "Le lieu n'a pas retrouvé cette addition",
  "pas-venu": "Le lieu ne t'a pas vu passer",
  doublon: "C'était en double",
  autre: "Le lieu n'a pas validé cette fois",
};

/** Ce que choisit le lieu en refusant une réservation, lu tel quel par le client */
export const LIBELLES_MOTIF_REFUS_RESERVATION: Readonly<Record<MotifRefusReservation, string>> = {
  complet: "C'est complet",
  ferme: "On est fermés à ce moment-là",
  "groupe-trop-grand": "Le groupe est trop grand pour nous",
  autre: "On ne peut pas cette fois",
};

export const LIBELLES_MOTIF_REFUS_VISITE_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_MOTIF_REFUS_VISITE>> = {
  fr: LIBELLES_MOTIF_REFUS_VISITE,
  en: LIBELLES_MOTIF_REFUS_VISITE_ANGLAIS,
};

export const LIBELLES_MOTIF_REFUS_CLIENT_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_MOTIF_REFUS_CLIENT>> = {
  fr: LIBELLES_MOTIF_REFUS_CLIENT,
  en: LIBELLES_MOTIF_REFUS_CLIENT_ANGLAIS,
};

export const LIBELLES_MOTIF_REFUS_RESERVATION_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_MOTIF_REFUS_RESERVATION>> = {
  fr: LIBELLES_MOTIF_REFUS_RESERVATION,
  en: LIBELLES_MOTIF_REFUS_RESERVATION_ANGLAIS,
};
