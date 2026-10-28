// Libellés des infos pratiques d'un lieu (fiche de l'app, et plus tard l'espace pro du site pour les remplir).

import type { AccueilAnimaux, MoyenPaiement, ReservationConseillee } from "../types/infos-pratiques.ts";
import type { ParLangue, Traduction } from "../types/traduction.ts";
import { LIBELLES_ANIMAUX_ANGLAIS, LIBELLES_PAIEMENT_ANGLAIS, LIBELLES_RESERVATION_ANGLAIS } from "./anglais/libelles-infos-pratiques.ts";

export const LIBELLES_ANIMAUX: Readonly<Record<AccueilAnimaux, { emoji: string; texte: string }>> = {
  bienvenus: { emoji: "🐶", texte: "Animaux bienvenus" },
  terrasse: { emoji: "🐕", texte: "Animaux en terrasse seulement" },
  non: { emoji: "🚫", texte: "Pas d'animaux" },
};

export const LIBELLES_PAIEMENT: Readonly<Record<MoyenPaiement, string>> = {
  cb: "carte bancaire",
  "sans-contact": "sans contact",
  especes: "espèces",
  "tickets-resto": "tickets resto",
  "cheques-vacances": "chèques-vacances",
};

export const LIBELLES_RESERVATION: Readonly<Record<ReservationConseillee, string>> = {
  inutile: "Pas besoin de réserver",
  conseillee: "Réservation conseillée",
  obligatoire: "Réservation obligatoire",
};

export const LIBELLES_ANIMAUX_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_ANIMAUX>> = { fr: LIBELLES_ANIMAUX, en: LIBELLES_ANIMAUX_ANGLAIS };

export const LIBELLES_PAIEMENT_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_PAIEMENT>> = { fr: LIBELLES_PAIEMENT, en: LIBELLES_PAIEMENT_ANGLAIS };

export const LIBELLES_RESERVATION_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_RESERVATION>> = { fr: LIBELLES_RESERVATION, en: LIBELLES_RESERVATION_ANGLAIS };
