import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRAN_RESERVATIONS_PRO } from "~/contenus/textes-ecran-pro-reservations";

export const TEXTES_ECRAN_RESERVATIONS_PRO_ANGLAIS: Traduction<typeof TEXTES_ECRAN_RESERVATIONS_PRO> = {
  ceClient: "this customer",
  retour: "Back",
  place: (position: number, total: number) => `, ${position} of ${total}`,
  initialesJours: ["M", "T", "W", "T", "F", "S", "S"],
};
