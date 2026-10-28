import type { Traduction } from "../../types/traduction.ts";
import type { LIBELLES_ANIMAUX, LIBELLES_PAIEMENT, LIBELLES_RESERVATION } from "../libelles-infos-pratiques.ts";

export const LIBELLES_ANIMAUX_ANGLAIS: Traduction<typeof LIBELLES_ANIMAUX> = {
  bienvenus: { emoji: "🐶", texte: "Pets welcome" },
  terrasse: { emoji: "🐕", texte: "Pets on the terrace only" },
  non: { emoji: "🚫", texte: "No pets" },
};

export const LIBELLES_PAIEMENT_ANGLAIS: Traduction<typeof LIBELLES_PAIEMENT> = {
  cb: "card",
  "sans-contact": "contactless",
  especes: "cash",
  "tickets-resto": "meal vouchers (titres-restaurant)",
  "cheques-vacances": "Chèques-Vacances (French holiday vouchers)",
};

export const LIBELLES_RESERVATION_ANGLAIS: Traduction<typeof LIBELLES_RESERVATION> = {
  inutile: "No need to book",
  conseillee: "Booking recommended",
  obligatoire: "Booking required",
};
