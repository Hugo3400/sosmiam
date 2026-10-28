import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_RESERVATIONS_PRO_ANGLAIS } from "~/contenus/anglais/textes-ecran-pro-reservations";

export const TEXTES_ECRAN_RESERVATIONS_PRO = {
  ceClient: "ce client",
  retour: "Retour",
  place: (position: number, total: number) => `, ${position} sur ${total}`,
  initialesJours: ["L", "M", "M", "J", "V", "S", "D"],
} as const;

export const TEXTES_ECRAN_RESERVATIONS_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_RESERVATIONS_PRO>> = {
  fr: TEXTES_ECRAN_RESERVATIONS_PRO,
  en: TEXTES_ECRAN_RESERVATIONS_PRO_ANGLAIS,
};
