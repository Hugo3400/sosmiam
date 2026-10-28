import type { Traduction } from "../../types/traduction.ts";
import type { LIBELLES_MOTIF_REFUS_CLIENT, LIBELLES_MOTIF_REFUS_RESERVATION, LIBELLES_MOTIF_REFUS_VISITE } from "../motifs-refus.ts";

export const LIBELLES_MOTIF_REFUS_VISITE_ANGLAIS: Traduction<typeof LIBELLES_MOTIF_REFUS_VISITE> = {
  introuvable: "I can't find this bill",
  "pas-venu": "This person isn't here",
  doublon: "Already confirmed",
  autre: "Another reason",
};

export const LIBELLES_MOTIF_REFUS_CLIENT_ANGLAIS: Traduction<typeof LIBELLES_MOTIF_REFUS_CLIENT> = {
  introuvable: "The place couldn't find this bill",
  "pas-venu": "The place didn't see you come in",
  doublon: "It was a duplicate",
  autre: "The place didn't confirm it this time",
};

export const LIBELLES_MOTIF_REFUS_RESERVATION_ANGLAIS: Traduction<typeof LIBELLES_MOTIF_REFUS_RESERVATION> = {
  complet: "We're fully booked",
  ferme: "We're closed at that time",
  "groupe-trop-grand": "The group's too big for us",
  autre: "We can't do it this time",
};
